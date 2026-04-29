import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Command } from '@commander-js/extra-typings';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { userRolesWithPermissions } from '@/types/enum/UserRole';
import { processInParallel } from '@/utils/async';

import { type Permission, type PermissionType, permissionTypes } from './types';

const logger = parentLogger.child({ module: 'permissions' });

export function registerPermissionsCommands(parentProgram: Command) {
  const program = parentProgram.command('permissions').description('Commandes de migration du système de permissions');

  program
    .command('backfill-demands')
    .description('Remplit les colonnes territoire, network_id et validated sur les demandes')
    .action(async () => {
      await backfillTerritoryCodes();
      await backfillNetworkId();
      await backfillValidated();
      logger.info('Backfill demands terminé');
    });

  program
    .command('backfill-territory')
    .description('Remplit uniquement les colonnes territoire (commune, dept, region, epci, ept)')
    .action(backfillTerritoryCodes);

  program
    .command('backfill-network')
    .description('Remplit uniquement network_id et network_type depuis legacy_values')
    .action(backfillNetworkId);

  program.command('backfill-validated').description('Remplit uniquement le flag validated depuis legacy_values').action(backfillValidated);

  program
    .command('generate-migration-plan')
    .description('Génère un CSV plan de migration des gestionnaires (rôles + permissions)')
    .option('-o, --output <path>', 'chemin du fichier CSV', 'migration-plan.csv')
    .action((opts) => generateMigrationPlan(opts.output));

  program
    .command('apply-migration-plan')
    .description('Applique le plan de migration CSV (rôles + permissions)')
    .argument('<file>', 'chemin du fichier CSV')
    .action((file) => applyMigrationPlan(file));

  program
    .command('diagnostic-collectivites')
    .description('Liste les comptes gestionnaires liés à des tags ville/métropole (candidats collectivité)')
    .action(diagnosticCollectivites);

  program
    .command('diagnostic-sncu')
    .description("Vérifie la cohérence entre l'id SNCU legacy et le réseau affecté (réseaux existants)")
    .action(diagnosticSncu);
}

// ─── Backfill territory ──────────────────────────────────────────────────────

async function backfillTerritoryCodes() {
  logger.info('Backfill territory codes...');

  const result = await sql`
    UPDATE demands d
    SET
      commune_code = c.insee_com,
      departement_code = c.insee_dep,
      region_code = c.insee_reg,
      epci_code = c.siren_epci
    FROM ign_communes c
    WHERE d.commune_code IS NULL
      AND d.deleted_at IS NULL
      AND d.legacy_values->>'Latitude' IS NOT NULL
      AND d.legacy_values->>'Longitude' IS NOT NULL
      AND ST_Contains(
        c.geom,
        ST_Transform(
          ST_SetSRID(
            ST_MakePoint(
              (d.legacy_values->>'Longitude')::double precision,
              (d.legacy_values->>'Latitude')::double precision
            ),
            4326
          ),
          2154
        )
      )
  `.execute(kdb);

  logger.info(`Commune/dept/region/epci: ${result.numAffectedRows} rows`);

  // EPT via membres JSONB
  const eptResult = await sql`
    UPDATE demands d
    SET
      ept_code = e.code
    FROM ept e
    WHERE d.ept_code IS NULL
      AND d.commune_code IS NOT NULL
      AND d.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(e.membres) m
        WHERE m->>'code' = d.commune_code
      )
  `.execute(kdb);

  logger.info(`EPT: ${eptResult.numAffectedRows} rows`);

  const missing = await kdb
    .selectFrom('demands')
    .select(sql`COUNT(*)`.as('count'))
    .where('commune_code', 'is', null)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();

  logger.info(`Demandes sans territoire: ${missing.count}`);
}

// ─── Backfill network ────────────────────────────────────────────────────────

async function backfillNetworkId() {
  logger.info('Backfill network_id via dernière éligibilité...');

  // 1a. Éligibilité directe (hors dans_pdp_*) : id_fcu pointe directement vers le réseau
  const directResult = await sql`
    WITH latest_eligibility AS (
      SELECT
        a.demand_id,
        (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int AS id_fcu,
        a.eligibility_history->-1->'eligibility'->>'type' AS elig_type
      FROM pro_eligibility_tests_addresses a
      WHERE a.demand_id IS NOT NULL
        AND jsonb_array_length(a.eligibility_history) > 0
        AND (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int > 0
        AND a.eligibility_history->-1->'eligibility'->>'type' != 'trop_eloigne'
        AND a.eligibility_history->-1->'eligibility'->>'type' NOT LIKE 'dans_pdp_%'
        AND (
          (a.eligibility_history->-1->'eligibility'->>'distance') IS NULL
          OR (a.eligibility_history->-1->'eligibility'->>'distance')::int < 500
        )
    )
    UPDATE demands d SET
      network_id = le.id_fcu,
      network_type = CASE
        WHEN le.elig_type LIKE '%futur%' THEN 'en_construction'
        ELSE 'existant'
      END
    FROM latest_eligibility le
    WHERE d.id = le.demand_id
      AND d.network_id IS NULL
      AND d.deleted_at IS NULL
  `.execute(kdb);

  logger.info(`Network ID (éligibilité directe): ${(directResult as any).numAffectedRows ?? '?'} rows`);

  // 1b. dans_pdp_* : id_fcu = PDP id → résoudre via PDP (SNCU, reseau_de_chaleur_ids, reseau_en_construction_ids)
  // Même logique que findPDPAssociatedNetwork : cherche le réseau le plus proche parmi tous ceux du PDP
  const pdpResult = await sql`
    WITH pdp_eligibility AS (
      SELECT
        a.demand_id,
        -- PDP 219 a été réindexé en 111
        CASE WHEN (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int = 219
          THEN 111
          ELSE (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int
        END AS pdp_id,
        ST_Transform(ST_SetSRID(ST_MakePoint(
          (d.legacy_values->>'Longitude')::double precision,
          (d.legacy_values->>'Latitude')::double precision
        ), 4326), 2154) AS demand_geom
      FROM pro_eligibility_tests_addresses a
      JOIN demands d ON d.id = a.demand_id
      WHERE a.demand_id IS NOT NULL
        AND d.network_id IS NULL
        AND d.deleted_at IS NULL
        AND jsonb_array_length(a.eligibility_history) > 0
        AND (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int > 0
        AND a.eligibility_history->-1->'eligibility'->>'type' LIKE 'dans_pdp_%'
        AND d.legacy_values->>'Longitude' IS NOT NULL
        AND d.legacy_values->>'Latitude' IS NOT NULL
    ),
    pdp_candidates AS (
      -- Réseaux existants via SNCU
      SELECT pe.demand_id, r.id_fcu AS network_id, 'existant' AS network_type,
        ST_Distance(r.geom, pe.demand_geom) AS dist
      FROM pdp_eligibility pe
      JOIN zone_de_developpement_prioritaire z ON z.id_fcu = pe.pdp_id
      JOIN reseaux_de_chaleur r ON r."Identifiant reseau" = z."Identifiant reseau" AND r.has_trace = true
      WHERE z."Identifiant reseau" IS NOT NULL AND z."Identifiant reseau" != ''
      UNION ALL
      -- Réseaux existants via reseau_de_chaleur_ids
      SELECT pe.demand_id, r.id_fcu AS network_id, 'existant' AS network_type,
        ST_Distance(r.geom, pe.demand_geom) AS dist
      FROM pdp_eligibility pe
      JOIN zone_de_developpement_prioritaire z ON z.id_fcu = pe.pdp_id
      JOIN reseaux_de_chaleur r ON r.id_fcu = ANY(z.reseau_de_chaleur_ids) AND r.has_trace = true
      WHERE z.reseau_de_chaleur_ids IS NOT NULL AND array_length(z.reseau_de_chaleur_ids, 1) > 0
      UNION ALL
      -- Réseaux/zones en construction via reseau_en_construction_ids
      SELECT pe.demand_id, rec.id_fcu AS network_id, 'en_construction' AS network_type,
        ST_Distance(rec.geom, pe.demand_geom) AS dist
      FROM pdp_eligibility pe
      JOIN zone_de_developpement_prioritaire z ON z.id_fcu = pe.pdp_id
      JOIN zones_et_reseaux_en_construction rec ON rec.id_fcu = ANY(z.reseau_en_construction_ids)
      WHERE z.reseau_en_construction_ids IS NOT NULL AND array_length(z.reseau_en_construction_ids, 1) > 0
    ),
    pdp_best AS (
      SELECT DISTINCT ON (demand_id) demand_id, network_id, network_type
      FROM pdp_candidates
      ORDER BY demand_id, dist
    )
    UPDATE demands d SET
      network_id = pb.network_id,
      network_type = pb.network_type
    FROM pdp_best pb
    WHERE d.id = pb.demand_id
      AND d.network_id IS NULL
      AND d.deleted_at IS NULL
  `.execute(kdb);

  logger.info(`Network ID (PDP): ${(pdpResult as any).numAffectedRows ?? '?'} rows`);

  // 2e passe : si la demande a un id SNCU legacy, on écrase avec le réseau existant correspondant
  const sncuResult = await sql`
    UPDATE demands d SET
      network_id = r.id_fcu,
      network_type = 'existant'
    FROM reseaux_de_chaleur r
    WHERE d.deleted_at IS NULL
      AND d.legacy_values->>'Identifiant réseau' IS NOT NULL
      AND d.legacy_values->>'Identifiant réseau' != ''
      AND r."Identifiant reseau" = d.legacy_values->>'Identifiant réseau'
      AND d.network_id IS NOT NULL
      AND d.network_id != r.id_fcu
  `.execute(kdb);

  logger.info(`Network ID (correction SNCU): ${(sncuResult as any).numAffectedRows ?? '?'} rows`);

  // Report des demandes sans éligibilité rattachable
  const missing = await sql`
    SELECT COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE a.id IS NULL)::int as no_eligibility_address,
      COUNT(*) FILTER (WHERE a.id IS NOT NULL AND (
        jsonb_array_length(a.eligibility_history) = 0
        OR a.eligibility_history->-1->'eligibility'->>'id_fcu' IS NULL
        OR (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int = 0
        OR a.eligibility_history->-1->'eligibility'->>'type' = 'trop_eloigne'
        OR (
          (a.eligibility_history->-1->'eligibility'->>'distance') IS NOT NULL
          AND (a.eligibility_history->-1->'eligibility'->>'distance')::int >= 500
        )
      ))::int as no_network_in_eligibility
    FROM demands d
    LEFT JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.network_id IS NULL
      AND d.deleted_at IS NULL
  `.execute(kdb);

  const stats = missing.rows[0] as any;
  logger.info(
    `Demandes sans network_id: ${stats.total} (${stats.no_eligibility_address} sans adresse éligibilité, ${stats.no_network_in_eligibility} sans réseau dans éligibilité)`
  );

  // Détail des demandes non affectées par type d'éligibilité
  const details = await sql`
    SELECT
      a.eligibility_history->-1->'eligibility'->>'type' as elig_type,
      COUNT(*)::int as cnt,
      MIN((a.eligibility_history->-1->'eligibility'->>'distance')::int) as distance_min,
      MAX((a.eligibility_history->-1->'eligibility'->>'distance')::int) as distance_max
    FROM demands d
    JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.network_id IS NULL
      AND d.deleted_at IS NULL
      AND jsonb_array_length(a.eligibility_history) > 0
    GROUP BY 1
    ORDER BY cnt DESC
  `.execute(kdb);

  if (details.rows.length > 0) {
    logger.info('Détail des demandes non affectées :');
    for (const row of details.rows) {
      const r = row as any;
      const distStr = r.distance_min != null ? `distance ${r.distance_min}-${r.distance_max}m` : 'distance N/A';
      logger.info(`  ${r.elig_type ?? "(pas d'éligibilité)"}: ${r.cnt} demandes (${distStr})`);
    }
  }

  // Export CSV des demandes non affectées
  const unassigned = await sql`
    SELECT
      d.id,
      d.created_at,
      d.legacy_values->>'Adresse' as adresse,
      d.legacy_values->>'Ville' as ville,
      d.legacy_values->>'Code Postal' as code_postal,
      d.legacy_values->>'Nom' as nom,
      d.legacy_values->>'Mail' as mail,
      d.legacy_values->>'Status' as status,
      d.legacy_values->>'Identifiant réseau' as sncu_legacy,
      d.commune_code,
      a.eligibility_history->-1->'eligibility'->>'type' as elig_type,
      (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int as elig_id_fcu,
      a.eligibility_history->-1->'eligibility'->>'nom' as elig_nom,
      (a.eligibility_history->-1->'eligibility'->>'distance')::int as elig_distance,
      a.eligibility_history->-1->'eligibility'->>'id_sncu' as elig_sncu
    FROM demands d
    LEFT JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.network_id IS NULL
      AND d.deleted_at IS NULL
    ORDER BY a.eligibility_history->-1->'eligibility'->>'type', d.created_at DESC
  `.execute(kdb);

  if (unassigned.rows.length > 0) {
    const csvPath = '/tmp/backfill-network-unassigned.csv';
    const headers = [
      'id',
      'created_at',
      'adresse',
      'ville',
      'code_postal',
      'nom',
      'mail',
      'status',
      'sncu_legacy',
      'commune_code',
      'elig_type',
      'elig_id_fcu',
      'elig_nom',
      'elig_distance',
      'elig_sncu',
    ];
    const csvRows = [headers.join(',')];
    for (const row of unassigned.rows) {
      const r = row as any;
      csvRows.push(
        headers
          .map((h) => {
            const val = r[h];
            if (val == null) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      );
    }
    writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
    logger.info(`${unassigned.rows.length} demandes non affectées exportées → ${csvPath}`);
  }
}

// ─── Backfill validated ──────────────────────────────────────────────────────

async function backfillValidated() {
  logger.info('Backfill validated...');

  await sql`
    UPDATE demands
    SET
      validated = COALESCE(legacy_values->>'Gestionnaires validés' = 'true', false)
  `.execute(kdb);

  const stats = await sql`
    SELECT validated, COUNT(*)::int as cnt
    FROM demands WHERE deleted_at IS NULL GROUP BY validated
  `.execute(kdb);

  for (const row of stats.rows) {
    logger.info(`  validated=${(row as any).validated}: ${(row as any).cnt}`);
  }
}

// ─── Tag → territory resolution ─────────────────────────────────────────────

/**
 * Hardcoded mapping for tags that don't match standard patterns.
 * key = tag name, value = { type, search } where search is the EPCI/commune name to look up.
 */
const specialTagMappings: Record<string, { type: 'epci'; search: string } | { type: 'commune'; search: string }> = {
  // Metropole tags with non-standard naming
  Ardenne_Metropole: { search: 'CA Ardenne Métropole', type: 'epci' },
  BordeauxM_Sud: { search: 'Bordeaux Métropole', type: 'epci' }, // sous-zone, même EPCI
  // Ville tags with EPCI/CC/CU prefix
  CA_Ouest_Rhodanien: { search: "CA de l'Ouest Rhodanien", type: 'epci' },
  CC_Loue_Lison: { search: 'CC Loue-Lison', type: 'epci' },
  Cergy_Pontoise: { search: 'CA de Cergy-Pontoise', type: 'epci' },
  'Clermont-FerrandM': { search: 'Clermont Auvergne Métropole', type: 'epci' },
  'CU_Charleville-Mezieres': { search: 'CA Ardenne Métropole', type: 'epci' },
  GrandAngoulême: { search: 'CA du Grand Angoulême', type: 'epci' },
  GrandBelfortCA: { search: 'CA Grand Belfort', type: 'epci' },
  GrandParisSud: { search: 'CA Grand Paris Sud Seine Essonne Sénart', type: 'epci' },
  'Lannion-Trégor Communauté': { search: 'CA Lannion-Trégor Communauté', type: 'epci' },
  'Le HavreM': { search: 'CU Le Havre Seine Métropole', type: 'epci' },
  'Le MansM': { search: 'CU Le Mans Métropole', type: 'epci' },
  'Mont-de-Marsan_Agglomération': { search: 'CA Mont de Marsan Agglomération', type: 'epci' },
  MorlaixCA: { search: 'CA Morlaix Communauté', type: 'epci' },
  MulhouseAg: { search: 'CA Mulhouse Alsace Agglomération', type: 'epci' },
  'Pau-Béarn-Pyrénées_CA': { search: 'CA Pau Béarn Pyrénées', type: 'epci' },
  QuimperCA: { search: 'CA Quimper Bretagne Occidentale', type: 'epci' },
  RouenM_rivegauche: { search: 'Métropole Rouen Normandie', type: 'epci' }, // sous-zone, même EPCI
  'Saint-EtienneM': { search: 'Saint-Étienne Métropole', type: 'epci' },
  // Commune name mismatches (accents, orthography)
  'Saint-Narbord': { search: 'Saint-Nabord', type: 'commune' },
  'Saint-Nazaire-Agglomération': { search: "CA de la Région Nazairienne et de l'Estuaire (CARENE)", type: 'epci' },
};

type ResolvedPermission = {
  type: 'commune' | 'epci' | 'ept' | 'reseau_existant' | 'reseau_en_construction';
  resource_id: string;
  label: string; // human-readable label for the report
};

/**
 * Email domains that identify a collectivity (mairie, EPCI, agglo, etc.).
 * For matching users:
 * - role is forced to 'collectivite'
 * - the listed territory permissions are injected (deduplicated with tag-based ones)
 * Domain key is the lowercase part after '@'.
 */
const collectiviteEmailDomains: Record<string, ResolvedPermission[]> = {
  'agglo-bourgesplus.fr': [{ label: 'Bourges', resource_id: '18033', type: 'commune' }],
  'agglo-haguenau.fr': [{ label: 'Haguenau', resource_id: '67180', type: 'commune' }],
  'agglo-larochelle.fr': [{ label: 'La Rochelle', resource_id: '17300', type: 'commune' }],
  'agglo-laval.fr': [{ label: 'Laval', resource_id: '53130', type: 'commune' }],
  'agglo-limoges.fr': [{ label: 'CU Limoges Métropole', resource_id: '248719312', type: 'epci' }],
  'agglo-pau.fr': [{ label: 'CA Pau Béarn Pyrénées', resource_id: '200067254', type: 'epci' }],
  'agglo-rochefortocean.fr': [{ label: 'Rochefort', resource_id: '17299', type: 'commune' }],
  'agglo-ville.chartres.fr': [{ label: 'CA Chartres Métropole', resource_id: '200033181', type: 'epci' }],
  'agglo.morlaix.fr': [{ label: 'CA Morlaix Communauté', resource_id: '242900835', type: 'epci' }],
  'agglodebrive.fr': [{ label: 'Brive-la-Gaillarde', resource_id: '19031', type: 'commune' }],
  'aggo-laval.fr': [{ label: 'Laval', resource_id: '53130', type: 'commune' }],
  'alfortville.fr': [{ label: 'Alfortville', resource_id: '94002', type: 'commune' }],
  'amiens-metropole.com': [{ label: 'CA Amiens Métropole', resource_id: '248000531', type: 'epci' }],
  'angersloiremetropole.fr': [{ label: 'CU Angers Loire Métropole', resource_id: '244900015', type: 'epci' }],
  'annecy.fr': [{ label: 'Annecy', resource_id: '74010', type: 'commune' }],
  'annemasse.fr': [{ label: 'Annemasse', resource_id: '74012', type: 'commune' }],
  'ardenne-metropole.fr': [{ label: 'CA Ardenne Métropole', resource_id: '200041630', type: 'epci' }],
  'aurillac.fr': [{ label: 'Aurillac', resource_id: '15014', type: 'commune' }],
  'beauvaisis.fr': [{ label: 'Beauvais', resource_id: '60057', type: 'commune' }],
  'blois.fr': [{ label: 'Blois', resource_id: '41018', type: 'commune' }],
  'bonneuil94.fr': [{ label: 'Bonneuil-sur-Marne', resource_id: '94011', type: 'commune' }],
  'bordeaux-metropole.fr': [{ label: 'Bordeaux Métropole', resource_id: '243300316', type: 'epci' }],
  'bourgenbresse.fr': [{ label: 'Bourg-en-Bresse', resource_id: '01053', type: 'commune' }],
  'bourgoinjailleu.fr': [{ label: 'Bourgoin-Jallieu', resource_id: '38053', type: 'commune' }],
  'brest-metropole.fr': [{ label: 'Brest Métropole', resource_id: '242900314', type: 'epci' }],
  'brive.fr': [{ label: 'Brive-la-Gaillarde', resource_id: '19031', type: 'commune' }],
  'c-or.fr': [{ label: "CA de l'Ouest Rhodanien", resource_id: '200040566', type: 'epci' }],
  'caenlamer.fr': [{ label: 'CU Caen la Mer', resource_id: '200065597', type: 'epci' }],
  'cclouelison.fr': [{ label: 'CC Loue-Lison', resource_id: '200068070', type: 'epci' }],
  'cergypontoise.fr': [{ label: 'CA de Cergy-Pontoise', resource_id: '249500109', type: 'epci' }],
  'chateauroux-metropole.fr': [{ label: 'Châteauroux', resource_id: '36044', type: 'commune' }],
  'clermontmetropole.eu': [{ label: 'Clermont Auvergne Métropole', resource_id: '246300701', type: 'epci' }],
  'cu-arras.org': [{ label: 'Arras', resource_id: '62041', type: 'commune' }],
  'decazeville.fr': [{ label: 'Decazeville', resource_id: '12089', type: 'commune' }],
  'ecla-jura.fr': [{ label: 'Lons-le-Saunier', resource_id: '39300', type: 'commune' }],
  'epinal.fr': [{ label: 'Épinal', resource_id: '88160', type: 'commune' }],
  'eurometropolemetz.eu': [{ label: 'Metz Métropole', resource_id: '200039865', type: 'epci' }],
  'fresnes94.fr': [{ label: 'Fresnes', resource_id: '94034', type: 'commune' }],
  'grand-chatellerault.fr': [{ label: 'Châtellerault', resource_id: '86066', type: 'commune' }],
  'grand-dole.fr': [{ label: 'Dole', resource_id: '39198', type: 'commune' }],
  'grandangouleme.fr': [{ label: 'CA du Grand Angoulême', resource_id: '200071827', type: 'epci' }],
  'grandbesancon.fr': [{ label: 'Besançon', resource_id: '25056', type: 'commune' }],
  'grandlyon.com': [{ label: 'Métropole de Lyon', resource_id: '200046977', type: 'epci' }],
  'grandnancy.eu': [{ label: 'Métropole du Grand Nancy', resource_id: '245400676', type: 'epci' }],
  'grandparissud.fr': [{ label: 'CA Grand Paris Sud Seine Essonne Sénart', resource_id: '200059228', type: 'epci' }],
  'grandpoitiers.fr': [{ label: 'Poitiers', resource_id: '86194', type: 'commune' }],
  'grenoblealpesmetropole.fr': [{ label: 'Grenoble-Alpes-Métropole', resource_id: '200040715', type: 'epci' }],
  'issoire.fr': [{ label: 'Issoire', resource_id: '63178', type: 'commune' }],
  'issoudun.fr': [{ label: 'Issoudun', resource_id: '36088', type: 'commune' }],
  'ivry94.fr': [{ label: 'Ivry-sur-Seine', resource_id: '94041', type: 'commune' }],
  'langon33.fr': [{ label: 'Langon', resource_id: '33227', type: 'commune' }],
  'lannion-tregor.com': [{ label: 'CA Lannion-Trégor Communauté', resource_id: '200065928', type: 'epci' }],
  'lehavremetro.fr': [{ label: 'CU Le Havre Seine Métropole', resource_id: '200084952', type: 'epci' }],
  'lemans.fr': [{ label: 'CU Le Mans Métropole', resource_id: '247200132', type: 'epci' }],
  'lillemetropole.fr': [{ label: 'Métropole Européenne de Lille', resource_id: '200093201', type: 'epci' }],
  'limoges-metropole.fr': [{ label: 'CU Limoges Métropole', resource_id: '248719312', type: 'epci' }],
  'lorient.bzh': [{ label: 'Lorient', resource_id: '56121', type: 'commune' }],
  'mairie-aixenprovence.fr': [{ label: 'Aix-en-Provence', resource_id: '13001', type: 'commune' }],
  'mairie-alfortville.fr': [{ label: 'Alfortville', resource_id: '94002', type: 'commune' }],
  'mairie-allos.fr': [{ label: 'Allos', resource_id: '04006', type: 'commune' }],
  'mairie-avignon.com': [{ label: 'Avignon', resource_id: '84007', type: 'commune' }],
  'mairie-bagneux.fr': [{ label: 'Bagneux', resource_id: '92007', type: 'commune' }],
  'mairie-belfort.fr': [{ label: 'Belfort', resource_id: '90010', type: 'commune' }],
  'mairie-boulogne-billancourt.fr': [{ label: 'Boulogne-Billancourt', resource_id: '92012', type: 'commune' }],
  'mairie-bretigny91.fr': [{ label: 'Brétigny-sur-Orge', resource_id: '91103', type: 'commune' }],
  'mairie-briancon.fr': [{ label: 'Briançon', resource_id: '05023', type: 'commune' }],
  'mairie-cerilly.com': [{ label: 'Cérilly', resource_id: '03048', type: 'commune' }],
  'mairie-chambery.fr': [{ label: 'Chambéry', resource_id: '73065', type: 'commune' }],
  'mairie-champigny94.fr': [{ label: 'Champigny-sur-Marne', resource_id: '94017', type: 'commune' }],
  'mairie-colombes.fr': [{ label: 'Colombes', resource_id: '92025', type: 'commune' }],
  'mairie-forbach.fr': [{ label: 'Forbach', resource_id: '57227', type: 'commune' }],
  'mairie-hennebont.fr': [{ label: 'Hennebont', resource_id: '56083', type: 'commune' }],
  'mairie-lens.fr': [{ label: 'Lens', resource_id: '62498', type: 'commune' }],
  'mairie-mondelange.fr': [{ label: 'Mondelange', resource_id: '57474', type: 'commune' }],
  'mairie-nanterre.fr': [{ label: 'Nanterre', resource_id: '92050', type: 'commune' }],
  'mairie-saintdizier.fr': [{ label: 'Saint-Dizier', resource_id: '52448', type: 'commune' }],
  'mairie-sarrebourg.fr': [{ label: 'Sarrebourg', resource_id: '57630', type: 'commune' }],
  'mairie-saverne.fr': [{ label: 'Saverne', resource_id: '67437', type: 'commune' }],
  'mairie-vitry94.fr': [{ label: 'Vitry-sur-Seine', resource_id: '94081', type: 'commune' }],
  'mairie-yenne.fr': [{ label: 'Yenne', resource_id: '73330', type: 'commune' }],
  'marseille.fr': [{ label: 'Marseille', resource_id: '13055', type: 'commune' }],
  'mende.fr': [{ label: 'Mende', resource_id: '48095', type: 'commune' }],
  'metropole-dijon.fr': [{ label: 'Dijon Métropole', resource_id: '242100410', type: 'epci' }],
  'metropole-rouen-normandie.fr': [{ label: 'Métropole Rouen Normandie', resource_id: '200023414', type: 'epci' }],
  'metropoletpm.fr': [{ label: 'Métropole Toulon-Provence-Méditerranée', resource_id: '248300543', type: 'epci' }],
  'montdemarsanagglo-eau.fr': [{ label: 'CA Mont de Marsan Agglomération', resource_id: '244000808', type: 'epci' }],
  'montpellier.fr': [{ label: 'Montpellier', resource_id: '34172', type: 'commune' }],
  'montpellier3m.fr': [{ label: 'Montpellier Méditerranée Métropole', resource_id: '243400017', type: 'epci' }],
  'mulhouse-alsace.fr': [{ label: 'CA Mulhouse Alsace Agglomération', resource_id: '200066009', type: 'epci' }],
  'nantesmetropole.fr': [{ label: 'Nantes Métropole', resource_id: '244400404', type: 'epci' }],
  'neuillysurmarne.fr': [{ label: 'Neuilly-sur-Marne', resource_id: '93050', type: 'commune' }],
  'nicecotedazur.org': [{ label: "Métropole Nice Côte d'Azur", resource_id: '200030195', type: 'epci' }],
  'orleans-metropole.fr': [{ label: 'Orléans Métropole', resource_id: '244500468', type: 'epci' }],
  'paris.fr': [{ label: 'Paris', resource_id: '75056', type: 'commune' }],
  'quimper.bzh': [{ label: 'CA Quimper Bretagne Occidentale', resource_id: '200068120', type: 'epci' }],
  'reims.fr': [{ label: 'Reims', resource_id: '51454', type: 'commune' }],
  'rennesmetropole.fr': [{ label: 'Rennes Métropole', resource_id: '243500139', type: 'epci' }],
  'rosnysousbois.fr': [{ label: 'Rosny-sous-Bois', resource_id: '93064', type: 'commune' }],
  'saint-etienne-metropole.fr': [{ label: 'Saint-Étienne Métropole', resource_id: '244200770', type: 'epci' }],
  'saint-marcellin.fr': [{ label: 'Saint-Marcellin', resource_id: '38416', type: 'commune' }],
  'saint-nabord.fr': [{ label: 'Saint-Nabord', resource_id: '88429', type: 'commune' }],
  'saint-quentin.fr': [{ label: 'Saint-Quentin', resource_id: '02691', type: 'commune' }],
  'saintnazaireagglo.fr': [{ label: "CA de la Région Nazairienne et de l'Estuaire (CARENE)", resource_id: '244400644', type: 'epci' }],
  'saumur.fr': [{ label: 'Saumur', resource_id: '49328', type: 'commune' }],
  'strasbourg.eu': [{ label: 'Eurométropole de Strasbourg', resource_id: '246700488', type: 'epci' }],
  'toulouse-metropole.fr': [{ label: 'Toulouse Métropole', resource_id: '243100518', type: 'epci' }],
  'tours-metropole.fr': [{ label: 'Tours Métropole Val de Loire', resource_id: '243700754', type: 'epci' }],
  'troyes-cm.fr': [{ label: 'CA Troyes Champagne Métropole', resource_id: '200069250', type: 'epci' }],
  'valenceromansagglo.fr': [{ label: 'Valence', resource_id: '26362', type: 'commune' }],
  'valenciennes-metropole.fr': [{ label: 'CA Valenciennes Métropole', resource_id: '245901160', type: 'epci' }],
  'ville-argenteuil.fr': [{ label: 'Argenteuil', resource_id: '95018', type: 'commune' }],
  'ville-castres.fr': [{ label: 'Castres', resource_id: '81065', type: 'commune' }],
  'ville-chateaubriant.fr': [{ label: 'Châteaubriant', resource_id: '44036', type: 'commune' }],
  'ville-courbevoie.fr': [{ label: 'Courbevoie', resource_id: '92026', type: 'commune' }],
  'ville-embrun.fr': [{ label: 'Embrun', resource_id: '05046', type: 'commune' }],
  'ville-larochelle.fr': [{ label: 'La Rochelle', resource_id: '17300', type: 'commune' }],
  'ville-levallois.fr': [{ label: 'Levallois-Perret', resource_id: '92044', type: 'commune' }],
  'ville-macon.fr': [{ label: 'Mâcon', resource_id: '71270', type: 'commune' }],
  'ville-montauban.fr': [{ label: 'Montauban', resource_id: '82121', type: 'commune' }],
  'ville-montrouge.fr': [{ label: 'Montrouge', resource_id: '92049', type: 'commune' }],
  'ville-nice.fr': [{ label: 'Nice', resource_id: '06088', type: 'commune' }],
  'ville-plaisir.fr': [{ label: 'Plaisir', resource_id: '78490', type: 'commune' }],
  'ville-pont-audemer.fr': [{ label: 'Pont-Audemer', resource_id: '27467', type: 'commune' }],
  'ville-saint-louis.fr': [{ label: 'Saint-Louis', resource_id: '68297', type: 'commune' }],
  'ville-suresnes.fr': [{ label: 'Suresnes', resource_id: '92073', type: 'commune' }],
  'ville-thiais.fr': [{ label: 'Thiais', resource_id: '94073', type: 'commune' }],
  'ville-thonon.fr': [{ label: 'Thonon-les-Bains', resource_id: '74281', type: 'commune' }],
  'ville-valenton.fr': [{ label: 'Valenton', resource_id: '94074', type: 'commune' }],
  'ville-villepinte.fr': [{ label: 'Villepinte', resource_id: '93078', type: 'commune' }],
  'ville-voreppe.fr': [{ label: 'Voreppe', resource_id: '38565', type: 'commune' }],
};

type TagResolution = {
  tag: string;
  tagType: 'ville' | 'metropole' | 'gestionnaire' | 'reseau' | null;
  permissions: ResolvedPermission[];
  confidence: 'ok' | 'ambiguous' | 'not_found';
  note?: string;
};

/** Preload all commune names and EPCI names for fast in-memory lookup */
async function loadLookupTables() {
  const [communes, epcis] = await Promise.all([
    sql`SELECT nom, insee_com, population FROM ign_communes ORDER BY population DESC`.execute(kdb),
    sql`SELECT nom, code, type FROM epci ORDER BY nom`.execute(kdb),
  ]);

  // Group communes by unaccented lowercase name, sorted by population desc (already ordered)
  const communesByName = new Map<string, { nom: string; insee_com: string; population: number }[]>();
  for (const row of communes.rows) {
    const r = row as any;
    const key = normalizeForLookup(r.nom);
    if (!communesByName.has(key)) {
      communesByName.set(key, []);
    }
    communesByName.get(key)!.push({ insee_com: r.insee_com, nom: r.nom, population: Number(r.population) });
  }

  // Index EPCI by normalized name
  const epciByName = new Map<string, { nom: string; code: string; type: string }>();
  for (const row of epcis.rows) {
    const r = row as any;
    epciByName.set(normalizeForLookup(r.nom), { code: r.code, nom: r.nom, type: r.type });
  }

  return { communesByName, epciByName };
}

function normalizeForLookup(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function resolveTagToTerritory(
  tagName: string,
  tagType: string | null,
  communesByName: Map<string, { nom: string; insee_com: string; population: number }[]>,
  epciByName: Map<string, { nom: string; code: string; type: string }>
): TagResolution {
  // 1. Hardcoded special mappings
  const special = specialTagMappings[tagName];
  if (special) {
    if (special.type === 'commune') {
      const key = normalizeForLookup(special.search);
      const matches = communesByName.get(key);
      if (matches && matches.length > 0) {
        return {
          confidence: 'ok',
          note: `mapping spécial → ${matches[0].nom}`,
          permissions: [{ label: matches[0].nom, resource_id: matches[0].insee_com, type: 'commune' }],
          tag: tagName,
          tagType: tagType as any,
        };
      }
    }
    if (special.type === 'epci') {
      // Try exact match first, then partial
      const key = normalizeForLookup(special.search);
      const exact = epciByName.get(key);
      if (exact) {
        return {
          confidence: 'ok',
          note: `mapping spécial → ${exact.nom}`,
          permissions: [{ label: exact.nom, resource_id: exact.code, type: 'epci' }],
          tag: tagName,
          tagType: tagType as any,
        };
      }
      // Partial match
      for (const [k, v] of Array.from(epciByName)) {
        if (k.includes(key) || key.includes(k)) {
          return {
            confidence: 'ok',
            note: `mapping spécial (partiel) → ${v.nom}`,
            permissions: [{ label: v.nom, resource_id: v.code, type: 'epci' }],
            tag: tagName,
            tagType: tagType as any,
          };
        }
      }
    }
    return {
      confidence: 'not_found',
      note: `mapping spécial défini mais non trouvé en base: ${special.search}`,
      permissions: [],
      tag: tagName,
      tagType: tagType as any,
    };
  }

  // 2. Metropole tags (ending with M, or tagged as 'metropole')
  if (tagType === 'metropole') {
    // Strip trailing M, CA suffixes for EPCI search
    let baseName = tagName;
    if (/M$/.test(baseName) && !baseName.includes(' ')) {
      baseName = baseName.slice(0, -1);
    }
    // Insert spaces before uppercase letters: "StrasbourgM" → "Strasbourg"
    baseName = baseName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');

    // Try "${baseName} Métropole" and variations
    const searches = [
      `${baseName} Métropole`,
      `${baseName} Metropole`,
      `Métropole de ${baseName}`,
      `Métropole ${baseName}`,
      `Eurométropole de ${baseName}`,
      `CU ${baseName} Métropole`,
      `CA ${baseName} Métropole`,
      baseName,
    ];

    for (const search of searches) {
      const key = normalizeForLookup(search);
      const exact = epciByName.get(key);
      if (exact) {
        return {
          confidence: 'ok',
          permissions: [{ label: exact.nom, resource_id: exact.code, type: 'epci' }],
          tag: tagName,
          tagType: 'metropole',
        };
      }
    }

    // Partial match on baseName
    const baseKey = normalizeForLookup(baseName);
    for (const [k, v] of Array.from(epciByName)) {
      if (k.includes(baseKey) && (v.type === 'METRO' || v.type === 'MET69' || v.type === 'CU' || v.type === 'CA')) {
        return {
          confidence: 'ambiguous',
          note: `match partiel EPCI: ${v.nom}`,
          permissions: [{ label: v.nom, resource_id: v.code, type: 'epci' }],
          tag: tagName,
          tagType: 'metropole',
        };
      }
    }

    return { confidence: 'not_found', note: `EPCI non trouvé pour "${baseName}"`, permissions: [], tag: tagName, tagType: 'metropole' };
  }

  // 3. Ville tags → commune lookup
  if (tagType === 'ville') {
    const key = normalizeForLookup(tagName);
    const matches = communesByName.get(key);
    if (matches && matches.length === 1) {
      return {
        confidence: 'ok',
        permissions: [{ label: matches[0].nom, resource_id: matches[0].insee_com, type: 'commune' }],
        tag: tagName,
        tagType: 'ville',
      };
    }
    if (matches && matches.length > 1) {
      // Take the most populated
      return {
        confidence: 'ambiguous',
        note: `${matches.length} homonymes, pris la plus peuplée (${matches[0].population} hab.)`,
        permissions: [{ label: matches[0].nom, resource_id: matches[0].insee_com, type: 'commune' }],
        tag: tagName,
        tagType: 'ville',
      };
    }
    return { confidence: 'not_found', note: 'commune non trouvée dans ign_communes', permissions: [], tag: tagName, tagType: 'ville' };
  }

  // 4. Non-territory tag (reseau, gestionnaire)
  return { confidence: 'ok', note: 'tag réseau/gestionnaire (pas de territoire)', permissions: [], tag: tagName, tagType: tagType as any };
}

// ─── Generate migration plan ────────────────────────────────────────────────

const CSV_SEPARATOR = ';';
const MULTI_VALUE_SEPARATOR = ' | ';
const CSV_HEADERS = [
  'email',
  'active',
  'tags_avant',
  'validé',
  'role_actuel',
  'role_cible',
  'categorie',
  'notes',
  'permissions_territoire',
  'permissions_reseau',
];

function formatPermForCsv(p: ResolvedPermission): string {
  return `${p.type}:${p.resource_id} (${p.label})`;
}

function escapeCsvField(value: string): string {
  if (value.includes(CSV_SEPARATOR) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvLine(fields: string[]): string {
  return fields.map(escapeCsvField).join(CSV_SEPARATOR);
}

async function generateMigrationPlan(outputPath: string) {
  logger.info('Génération du plan de migration...');

  const { communesByName, epciByName } = await loadLookupTables();

  // Preload tag types
  const allTags = await sql`SELECT name, type FROM tags`.execute(kdb);
  const tagTypeMap = new Map<string, string>();
  for (const row of allTags.rows) {
    tagTypeMap.set((row as any).name, (row as any).type);
  }

  // All gestionnaire users with tags
  const users = await kdb
    .selectFrom('users')
    .select(['id', 'email', 'gestionnaires', 'active'])
    .where('role', '=', 'gestionnaire')
    .where('gestionnaires', 'is not', null)
    .execute();

  logger.info(`${users.length} gestionnaires avec tags`);

  // Preload network tag associations
  const [existingNetworkTags, constructionNetworkTags, existingBySncuRows] = await Promise.all([
    sql`SELECT id_fcu, nom_reseau, unnest(tags) as tag FROM reseaux_de_chaleur WHERE tags IS NOT NULL`.execute(kdb),
    sql`SELECT id_fcu, nom_reseau, unnest(tags) as tag FROM zones_et_reseaux_en_construction WHERE tags IS NOT NULL`.execute(kdb),
    sql`SELECT id_fcu, nom_reseau, "Identifiant reseau" as sncu FROM reseaux_de_chaleur WHERE "Identifiant reseau" IS NOT NULL`.execute(
      kdb
    ),
  ]);

  const existingByTag = new Map<string, { id_fcu: number; nom: string }[]>();
  for (const row of existingNetworkTags.rows) {
    const r = row as any;
    if (!existingByTag.has(r.tag)) existingByTag.set(r.tag, []);
    existingByTag.get(r.tag)!.push({ id_fcu: r.id_fcu, nom: r.nom_reseau ?? '' });
  }

  const constructionByTag = new Map<string, { id_fcu: number; nom: string }[]>();
  for (const row of constructionNetworkTags.rows) {
    const r = row as any;
    if (!constructionByTag.has(r.tag)) constructionByTag.set(r.tag, []);
    constructionByTag.get(r.tag)!.push({ id_fcu: r.id_fcu, nom: r.nom_reseau ?? '' });
  }

  const existingBySncu = new Map<string, { id_fcu: number; nom: string }>();
  for (const row of existingBySncuRows.rows) {
    const r = row as any;
    existingBySncu.set(r.sncu, { id_fcu: r.id_fcu, nom: r.nom_reseau ?? '' });
  }

  // ALEC_MVE EPTs
  const alecMveEpts = await sql`SELECT code, nom FROM ept WHERE nom IN ('Est Ensemble', 'Paris Est Marne et Bois')`.execute(kdb);
  const alecMveEptCodes = alecMveEpts.rows.map((r: any) => ({ code: r.code, nom: r.nom }));

  // Build CSV rows
  type CsvRow = {
    email: string;
    active: boolean;
    tags: string[];
    roleActuel: string;
    roleCible: string;
    categorie: string;
    territoryPerms: ResolvedPermission[];
    networkPerms: ResolvedPermission[];
    notes: string[];
  };

  const rows: CsvRow[] = [];

  await processInParallel(users, 10, async (user) => {
    if (!user.gestionnaires || user.gestionnaires.length === 0) return;

    const networkPerms: ResolvedPermission[] = [];
    const territoryPerms: ResolvedPermission[] = [];
    const notes: string[] = [];
    let isAlec = false;
    let isApc = false;

    for (const tagName of user.gestionnaires) {
      const tagType = tagTypeMap.get(tagName) ?? null;

      // ALEC_MVE
      if (tagName === 'ALEC_MVE') {
        isAlec = true;
        for (const ept of alecMveEptCodes) {
          territoryPerms.push({ label: ept.nom, resource_id: ept.code, type: 'ept' });
        }
        continue;
      }

      // APC → gestionnaire avec permission commune Paris
      if (tagName === 'APC') {
        isApc = true;
        territoryPerms.push({ label: 'Paris', resource_id: '75056', type: 'commune' });
        continue;
      }

      // Network permissions
      const existing = existingByTag.get(tagName) ?? [];
      for (const net of existing) {
        networkPerms.push({ label: net.nom, resource_id: String(net.id_fcu), type: 'reseau_existant' });
      }

      const construction = constructionByTag.get(tagName) ?? [];
      for (const net of construction) {
        networkPerms.push({ label: net.nom, resource_id: String(net.id_fcu), type: 'reseau_en_construction' });
      }

      // Fallback SNCU
      if (existing.length === 0 && construction.length === 0) {
        const sncuMatch = tagName.match(/_(\d{4}C)$/);
        if (sncuMatch) {
          const sncu = sncuMatch[1];
          const net = existingBySncu.get(sncu);
          if (net) {
            networkPerms.push({ label: net.nom, resource_id: String(net.id_fcu), type: 'reseau_existant' });
            notes.push(`fallback SNCU ${sncu} → réseau #${net.id_fcu}`);
          } else {
            notes.push(`tag ${tagName}: SNCU ${sncu} non trouvé`);
          }
        }
      }

      // Territory permissions
      // Effective type: use tag type from DB, or fallback to 'ville' if the tag matches a commune name
      let effectiveTagType = tagType;
      if (!effectiveTagType) {
        const key = normalizeForLookup(tagName);
        if (communesByName.has(key)) {
          effectiveTagType = 'ville';
          notes.push(`tag ${tagName}: absent de la table tags, trouvé dans ign_communes`);
        }
      }

      if (effectiveTagType === 'ville' || effectiveTagType === 'metropole') {
        const resolution = resolveTagToTerritory(tagName, effectiveTagType, communesByName, epciByName);
        for (const perm of resolution.permissions) {
          territoryPerms.push(perm);
        }
        if (resolution.confidence === 'ambiguous') {
          if (effectiveTagType === 'ville') {
            const key = normalizeForLookup(tagName);
            const matches = communesByName.get(key);
            if (matches && matches.length > 1) {
              const details = matches.map((m) => `${m.nom} (${m.insee_com}, ${m.population} hab.)`).join(' / ');
              notes.push(`homonymes pour ${tagName}: ${details} → pris le plus peuplé`);
            }
          }
          if (resolution.note) notes.push(resolution.note);
        } else if (resolution.confidence === 'not_found') {
          notes.push(`tag ${tagName}: ${resolution.note ?? 'territoire non trouvé'}`);
        }
      } else if (!effectiveTagType && !tagName.match(/_(\d{4}C)$/) && tagName !== 'ALEC_MVE') {
        // Tag truly unknown
        notes.push(`tag ${tagName}: type inconnu (absent de la table tags et ign_communes)`);
      }
    }

    // Flag tag-only resolution failure before any email-based injection
    if (networkPerms.length === 0 && territoryPerms.length === 0) {
      notes.push('aucune permission résolue depuis les tags');
    }

    const emailLower = user.email.toLowerCase();
    const emailDomain = emailLower.split('@')[1] ?? '';
    const isAduhmeEmail = emailDomain === 'aduhme.org';
    const isMetropoleEmail = emailLower.includes('metropole');
    const collectiviteDomainPerms = collectiviteEmailDomains[emailDomain];
    const isCollectiviteEmailDomain = collectiviteDomainPerms !== undefined;

    if (collectiviteDomainPerms) {
      for (const perm of collectiviteDomainPerms) {
        territoryPerms.push(perm);
      }
      notes.push(`permissions territoire injectées via domaine email: ${emailDomain}`);
    }

    // Deduplicate permissions by type:resource_id
    const dedup = (perms: ResolvedPermission[]) => {
      const seen = new Set<string>();
      return perms.filter((p) => {
        const key = `${p.type}:${p.resource_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const dedupNetwork = dedup(networkPerms);
    const dedupTerritory = dedup(territoryPerms);

    const hasNetwork = dedupNetwork.length > 0;
    const hasTerritory = dedupTerritory.length > 0;

    let categorie: string;
    if (isAlec || isAduhmeEmail) {
      categorie = 'alec';
    } else if (isApc) {
      categorie = 'gestionnaire_territoire';
    } else if (hasNetwork && hasTerritory) {
      categorie = 'mixte_reseau_territoire';
    } else if (hasNetwork) {
      categorie = 'gestionnaire_pur';
    } else if (hasTerritory) {
      categorie = 'collectivite_pur';
    } else {
      categorie = 'sans_permission';
    }

    let roleCible: string;
    if (isAlec || isAduhmeEmail) {
      roleCible = 'alec';
    } else if (isMetropoleEmail || isCollectiviteEmailDomain) {
      roleCible = 'collectivite';
    } else if (isApc) {
      roleCible = 'gestionnaire';
    } else if (hasNetwork && !hasTerritory) {
      roleCible = 'gestionnaire';
    } else if (!hasNetwork && hasTerritory) {
      roleCible = 'collectivite';
    } else {
      roleCible = ''; // à trancher
    }

    rows.push({
      active: user.active ?? false,
      categorie,
      email: user.email,
      networkPerms: dedupNetwork,
      notes,
      roleActuel: 'gestionnaire',
      roleCible,
      tags: user.gestionnaires,
      territoryPerms: dedupTerritory,
    });
  });

  // Sort by categorie then email
  const categoryOrder = [
    'alec',
    'gestionnaire_territoire',
    'collectivite_pur',
    'gestionnaire_pur',
    'mixte_reseau_territoire',
    'sans_permission',
  ];
  rows.sort((a, b) => {
    const catDiff = categoryOrder.indexOf(a.categorie) - categoryOrder.indexOf(b.categorie);
    if (catDiff !== 0) return catDiff;
    return a.email.localeCompare(b.email);
  });

  // Write CSV
  const csvRows = [csvLine(CSV_HEADERS)];
  for (const row of rows) {
    csvRows.push(
      csvLine([
        row.email,
        row.active ? 'oui' : 'non',
        row.tags.join(MULTI_VALUE_SEPARATOR),
        '',
        row.roleActuel,
        row.roleCible,
        row.categorie,
        row.notes.join(MULTI_VALUE_SEPARATOR),
        row.territoryPerms.map(formatPermForCsv).join(MULTI_VALUE_SEPARATOR),
        row.networkPerms.map(formatPermForCsv).join(MULTI_VALUE_SEPARATOR),
      ])
    );
  }

  writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');

  // Summary
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.categorie] = (counts[row.categorie] ?? 0) + 1;
  }

  logger.info('');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('  RÉSUMÉ');
  logger.info('═══════════════════════════════════════════════════════════');
  for (const cat of categoryOrder) {
    logger.info(`  ${cat}: ${counts[cat] ?? 0}`);
  }
  logger.info(`  Total: ${rows.length}`);
  logger.info(`  Rôle pré-rempli: ${rows.filter((r) => r.roleCible !== '').length}`);
  logger.info(`  À trancher: ${rows.filter((r) => r.roleCible === '').length}`);
  logger.info('');
  const absolutePath = resolve(outputPath);
  const fileLink = `\x1b]8;;file://${absolutePath}\x1b\\${absolutePath}\x1b]8;;\x1b\\`;
  logger.info(`Plan généré → ${fileLink}`);
}

// ─── Apply migration plan ───────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === CSV_SEPARATOR) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// The CSV format `type:id (label)` always carries a resource_id — national (null resource_id) can't occur.
type ParsedPermission = Exclude<Permission, { resource_id: null }>;

function parsePermsFromCsv(value: string): ParsedPermission[] {
  if (!value.trim()) return [];
  return value.split(MULTI_VALUE_SEPARATOR.trim()).map((s) => {
    const match = s.trim().match(/^(\w+):(\S+)\s*\(/);
    if (!match) {
      throw new Error(`Format de permission invalide: "${s.trim()}" — attendu: type:id (label)`);
    }
    const type = match[1];
    if (!(permissionTypes as readonly string[]).includes(type) || type === 'national') {
      throw new Error(`Type de permission invalide: "${type}" — attendu: ${permissionTypes.filter((t) => t !== 'national').join(', ')}`);
    }
    return { resource_id: match[2], type: type as PermissionType } as ParsedPermission;
  });
}

async function applyMigrationPlan(filePath: string) {
  logger.info(`Application du plan de migration: ${filePath}`);

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim());

  if (lines.length < 2) {
    logger.error('Fichier CSV vide ou invalide');
    return;
  }

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const colIndex = (name: string) => {
    const idx = headers.indexOf(name);
    if (idx === -1) throw new Error(`Colonne "${name}" manquante dans le CSV`);
    return idx;
  };

  const emailIdx = colIndex('email');
  const roleCibleIdx = colIndex('role_cible');
  const permsTerritoireIdx = colIndex('permissions_territoire');
  const permsReseauIdx = colIndex('permissions_reseau');

  const validRoleSchema = z.enum(userRolesWithPermissions);

  let applied = 0;
  let permsOnly = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const email = fields[emailIdx]?.trim();
    const rawRole = fields[roleCibleIdx]?.trim();
    const rawTerritory = fields[permsTerritoireIdx] ?? '';
    const rawNetwork = fields[permsReseauIdx] ?? '';

    if (!email) continue;

    // Nothing to apply
    if (!rawRole && !rawTerritory.trim() && !rawNetwork.trim()) {
      skipped++;
      continue;
    }

    let roleCible: (typeof userRolesWithPermissions)[number] | null = null;
    if (rawRole) {
      const roleResult = validRoleSchema.safeParse(rawRole);
      if (!roleResult.success) {
        logger.error(`Ligne ${i + 1}: rôle "${rawRole}" invalide pour ${email} (attendu: ${userRolesWithPermissions.join(', ')})`);
        errors++;
        continue;
      }
      roleCible = roleResult.data;
    }

    // Find user
    const user = await kdb.selectFrom('users').select(['id']).where('email', '=', email).executeTakeFirst();
    if (!user) {
      logger.error(`Ligne ${i + 1}: utilisateur ${email} non trouvé`);
      errors++;
      continue;
    }

    // Parse permissions
    let territoryPerms: ParsedPermission[];
    let networkPerms: ParsedPermission[];
    try {
      territoryPerms = parsePermsFromCsv(rawTerritory);
      networkPerms = parsePermsFromCsv(rawNetwork);
    } catch (e: any) {
      logger.error(`Ligne ${i + 1} (${email}): ${e.message}`);
      errors++;
      continue;
    }

    // Apply: update role (only when provided)
    if (roleCible) {
      await kdb.updateTable('users').set({ role: roleCible }).where('id', '=', user.id).execute();
    }

    // Apply: replace permissions (always — the CSV is source of truth)
    await kdb.deleteFrom('user_permissions').where('user_id', '=', user.id).execute();

    const allPerms = [...territoryPerms, ...networkPerms].map((p) => ({
      resource_id: p.resource_id,
      type: p.type,
      user_id: user.id,
    }));

    if (allPerms.length > 0) {
      await kdb
        .insertInto('user_permissions')
        .values(allPerms)
        .onConflict((oc) => oc.columns(['user_id', 'type', 'resource_id']).doNothing())
        .execute();
    }

    if (roleCible) {
      logger.info(`  [OK] ${email} → ${roleCible} (${allPerms.length} permissions)`);
      applied++;
    } else {
      logger.info(`  [PERMS] ${email} (${allPerms.length} permissions, rôle inchangé)`);
      permsOnly++;
    }
  }

  logger.info('');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('  RÉSUMÉ APPLICATION');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info(`  Appliqués (rôle + perms): ${applied}`);
  logger.info(`  Permissions seules (rôle vide): ${permsOnly}`);
  logger.info(`  Ignorés (rien à appliquer): ${skipped}`);
  logger.info(`  Erreurs: ${errors}`);
}

// ─── Diagnostic collectivités ────────────────────────────────────────────────

async function diagnosticCollectivites() {
  logger.info('Diagnostic: comptes gestionnaires avec tags ville/métropole...');

  const results = await sql`
    SELECT
      u.id,
      u.email,
      u.gestionnaires,
      u.structure_name,
      u.active,
      ARRAY(
        SELECT t.name FROM tags t
        WHERE t.name = ANY(u.gestionnaires) AND t.type IN ('ville', 'metropole')
      ) as territory_tags,
      ARRAY(
        SELECT t.name FROM tags t
        WHERE t.name = ANY(u.gestionnaires) AND t.type NOT IN ('ville', 'metropole')
      ) as other_tags
    FROM users u
    WHERE u.role = 'gestionnaire'
      AND u.gestionnaires IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM tags t
        WHERE t.name = ANY(u.gestionnaires) AND t.type IN ('ville', 'metropole')
      )
    ORDER BY u.email
  `.execute(kdb);

  logger.info(`${results.rows.length} comptes candidats collectivité:`);
  for (const row of results.rows) {
    const r = row as any;
    const hasOtherTags = r.other_tags.length > 0;
    logger.info(
      `  ${r.email} (active=${r.active}) — tags territoire: [${r.territory_tags.join(', ')}]${hasOtherTags ? ` — ATTENTION aussi tags non-territoire: [${r.other_tags.join(', ')}]` : ''}`
    );
  }
}

// ─── Diagnostic SNCU ────────────────────────────────────────────────────────

async function diagnosticSncu() {
  logger.info('Diagnostic: cohérence id SNCU legacy vs réseau affecté...');

  const results = await sql`
    SELECT
      d.id,
      d.created_at,
      d.updated_at,
      d.network_id as reseau_affecte_id_fcu,
      r.nom_reseau as reseau_affecte_nom,
      r."Identifiant reseau" as reseau_affecte_sncu,
      d.legacy_values->>'Identifiant réseau' as sncu_legacy,
      r_legacy.id_fcu as sncu_legacy_id_fcu,
      r_legacy.nom_reseau as sncu_legacy_nom,
      d.legacy_values->>'Adresse' as adresse,
      d.legacy_values->>'Ville' as ville,
      d.legacy_values->>'Code Postal' as code_postal,
      d.legacy_values->>'Status' as status,
      d.legacy_values->>'Nom' as nom,
      d.legacy_values->>'Mail' as mail,
      d.legacy_values->>'Structure' as structure,
      d.validated,
      d.commune_code,
      a.eligibility_history->-1->'eligibility'->>'type' as elig_type,
      (a.eligibility_history->-1->'eligibility'->>'distance')::int as elig_distance,
      a.eligibility_history->-1->'calculated_at' as elig_date,
      CASE
        WHEN d.legacy_values->>'Identifiant réseau' IS NULL OR d.legacy_values->>'Identifiant réseau' = '' THEN 'pas_de_sncu_legacy'
        WHEN r."Identifiant reseau" = d.legacy_values->>'Identifiant réseau' THEN 'match'
        ELSE 'mismatch'
      END as coherence
    FROM demands d
    JOIN reseaux_de_chaleur r ON r.id_fcu = d.network_id
    LEFT JOIN reseaux_de_chaleur r_legacy ON r_legacy."Identifiant reseau" = d.legacy_values->>'Identifiant réseau'
    LEFT JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.deleted_at IS NULL
      AND d.network_type = 'existant'
      AND d.network_id IS NOT NULL
  `.execute(kdb);

  // Stats
  const byStatus: Record<string, number> = {};
  let mismatchCount = 0;
  for (const row of results.rows) {
    const r = row as any;
    byStatus[r.coherence] = (byStatus[r.coherence] ?? 0) + 1;
    if (r.coherence === 'mismatch') mismatchCount++;
  }

  logger.info(`Résultats sur ${results.rows.length} demandes (réseau existant) :`);
  for (const [status, count] of Object.entries(byStatus)) {
    logger.info(`  ${status}: ${count}`);
  }

  // Export CSV des mismatches
  if (mismatchCount > 0) {
    const csvPath = '/tmp/diagnostic-sncu-mismatches.csv';
    const headers = [
      'id',
      'created_at',
      'updated_at',
      'reseau_affecte_id_fcu',
      'reseau_affecte_nom',
      'reseau_affecte_sncu',
      'sncu_legacy',
      'sncu_legacy_id_fcu',
      'sncu_legacy_nom',
      'adresse',
      'ville',
      'code_postal',
      'status',
      'nom',
      'mail',
      'structure',
      'validated',
      'commune_code',
      'elig_type',
      'elig_distance',
      'elig_date',
    ];
    const csvRows = [headers.join(',')];
    for (const row of results.rows) {
      const r = row as any;
      if (r.coherence !== 'mismatch') continue;
      csvRows.push(
        headers
          .map((h) => {
            const val = r[h];
            if (val == null) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      );
    }
    writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
    logger.info(`${mismatchCount} incohérences exportées → ${csvPath}`);
  } else {
    logger.info('Aucune incohérence détectée.');
  }
}
