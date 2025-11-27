#!/usr/bin/env tsx
/**
 * Script de correction des id_fcu incorrects pour les adresses PDP
 *
 * Ce script applique 2 méthodes de correction:
 * 1. Via id_sncu (2 431 adresses)
 * 2. Via nom + géolocalisation (21 adresses)
 *
 * Pour les adresses restantes (26), recalcule l'éligibilité complète.
 *
 * Usage: pnpm tsx src/modules/pro-eligibility-tests/commands/fix-pdp-id-fcu.ts [--dry-run]
 */

import { sql } from 'kysely';
import { getAddressEligibilityHistoryEntry } from '@/modules/pro-eligibility-tests/server/service';
import { kdb } from '@/server/db/kysely';

const DRY_RUN = process.argv.includes('--dry-run');

type EligibilityHistoryItem = {
  transition: string;
  eligibility: {
    type: string;
    id_sncu?: string;
    id_fcu?: string;
    nom?: string;
    distance?: number;
    communes?: string[];
    tags?: string[];
    eligible?: boolean;
    taux_enrr?: number;
    contenu_co2_acv?: number;
  };
  calculated_at: string;
};

async function main() {
  console.log('🔧 Correction des id_fcu incorrects pour les adresses PDP');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (aucune modification)' : '✍️  ÉCRITURE'}\n`);

  // Étape 1: Correction via id_sncu
  console.log('📍 ÉTAPE 1: Correction via id_sncu...');
  const correctedViaSncu = await correctViaIdSncu();
  console.log(`✅ ${correctedViaSncu} adresses corrigées via id_sncu\n`);

  // Étape 2: Correction via nom + géolocalisation
  console.log('🗺️  ÉTAPE 2: Correction via nom + géolocalisation...');
  const correctedViaNameGeo = await correctViaNameAndGeo();
  console.log(`✅ ${correctedViaNameGeo} adresses corrigées via nom + géo\n`);

  // Étape 3: Recalcul complet pour les adresses restantes
  console.log('🔄 ÉTAPE 3: Recalcul complet pour les adresses non corrigées...');
  const recalculated = await recalculateRemainingAddresses();
  console.log(`✅ ${recalculated} adresses recalculées\n`);

  // Résumé
  console.log('📊 RÉSUMÉ:');
  console.log(`   - Corrigées via id_sncu: ${correctedViaSncu}`);
  console.log(`   - Corrigées via nom+géo: ${correctedViaNameGeo}`);
  console.log(`   - Recalculées: ${recalculated}`);
  console.log(`   - TOTAL: ${correctedViaSncu + correctedViaNameGeo + recalculated}`);

  if (DRY_RUN) {
    console.log('\n⚠️  Aucune modification effectuée (mode dry-run)');
    console.log('   Relancez sans --dry-run pour appliquer les changements');
  } else {
    console.log('\n✅ Migration terminée avec succès!');
  }
}

/**
 * Méthode 1: Correction via id_sncu
 * Corrige les id_fcu en utilisant la correspondance id_sncu -> Identifiant reseau
 */
async function correctViaIdSncu(): Promise<number> {
  if (DRY_RUN) {
    // Compter combien seraient affectées
    const result = await kdb
      .selectFrom('pro_eligibility_tests_addresses as peta')
      .select(({ fn }) => fn.countAll<string>().as('count'))
      .where(({ eb, exists, selectFrom }) =>
        exists(
          selectFrom('pro_eligibility_tests_addresses as peta2')
            .select(sql`1`.as('one'))
            .whereRef('peta2.id', '=', 'peta.id')
            .where(({ eb: eb2 }) =>
              eb2(
                sql`jsonb_path_exists(
                  eligibility_history,
                  '$[*].eligibility ? (@.type == "dans_pdp_reseau_existant" || @.type == "dans_pdp_reseau_futur")'
                )`,
                '=',
                true
              )
            )
        )
      )
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  // Appliquer la correction
  const result = await sql`
    WITH corrected_history AS (
      SELECT
        peta.id,
        jsonb_agg(
          CASE
            WHEN
              item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
              AND item->'eligibility'->>'id_sncu' IS NOT NULL
              AND item->'eligibility'->>'id_sncu' != ''
              AND rdc.id_fcu IS NOT NULL
            THEN
              jsonb_set(
                item,
                '{eligibility,id_fcu}',
                to_jsonb(rdc.id_fcu::text),
                true
              )
            ELSE item
          END
          ORDER BY ordinality
        ) as new_history
      FROM pro_eligibility_tests_addresses peta
      CROSS JOIN LATERAL jsonb_array_elements(peta.eligibility_history) WITH ORDINALITY as item
      LEFT JOIN reseaux_de_chaleur rdc
        ON rdc."Identifiant reseau" = item->'eligibility'->>'id_sncu'
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(peta.eligibility_history) as h
        WHERE h->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
      )
      GROUP BY peta.id
    )
    UPDATE pro_eligibility_tests_addresses peta
    SET eligibility_history = ch.new_history
    FROM corrected_history ch
    WHERE peta.id = ch.id
  `.execute(kdb);

  return Number(result.numAffectedRows || 0);
}

/**
 * Méthode 2: Correction via nom + géolocalisation
 * Pour les cas non corrigés par Méthode 1, utilise le nom du réseau
 * et la distance géographique pour trouver le bon id_fcu
 */
async function correctViaNameAndGeo(): Promise<number> {
  if (DRY_RUN) {
    // Compter combien seraient affectées
    const result = await sql`
      SELECT COUNT(DISTINCT peta.id) as count
      FROM pro_eligibility_tests_addresses peta
      CROSS JOIN LATERAL jsonb_array_elements(peta.eligibility_history) WITH ORDINALITY as item
      LEFT JOIN reseaux_de_chaleur rdc_check
        ON rdc_check."Identifiant reseau" = item->'eligibility'->>'id_sncu'
      LEFT JOIN zones_et_reseaux_en_construction zec
        ON LOWER(TRIM(zec.nom_reseau)) = LOWER(TRIM(item->'eligibility'->>'nom'))
        AND item->'eligibility'->>'type' = 'dans_pdp_reseau_futur'
      LEFT JOIN reseaux_de_chaleur rdc2
        ON LOWER(TRIM(rdc2.nom_reseau)) = LOWER(TRIM(item->'eligibility'->>'nom'))
        AND item->'eligibility'->>'type' = 'dans_pdp_reseau_existant'
      WHERE item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
        AND rdc_check.id_fcu IS NULL
        AND item->'eligibility'->>'nom' IS NOT NULL
        AND item->'eligibility'->>'nom' != ''
        AND peta.geom IS NOT NULL
        AND (zec.id_fcu IS NOT NULL OR rdc2.id_fcu IS NOT NULL)
    `.execute(kdb);

    return Number((result.rows[0] as any)?.count || 0);
  }

  // Appliquer la correction
  const result = await sql`
    WITH best_network_by_name AS (
      SELECT DISTINCT ON (peta.id, item.ordinality)
        peta.id,
        item.ordinality,
        COALESCE(zec.id_fcu, rdc2.id_fcu) as id_fcu_correct
      FROM pro_eligibility_tests_addresses peta
      CROSS JOIN LATERAL jsonb_array_elements(peta.eligibility_history) WITH ORDINALITY as item
      LEFT JOIN reseaux_de_chaleur rdc_check
        ON rdc_check."Identifiant reseau" = item->'eligibility'->>'id_sncu'
      LEFT JOIN zones_et_reseaux_en_construction zec
        ON LOWER(TRIM(zec.nom_reseau)) = LOWER(TRIM(item->'eligibility'->>'nom'))
        AND item->'eligibility'->>'type' = 'dans_pdp_reseau_futur'
      LEFT JOIN reseaux_de_chaleur rdc2
        ON LOWER(TRIM(rdc2.nom_reseau)) = LOWER(TRIM(item->'eligibility'->>'nom'))
        AND item->'eligibility'->>'type' = 'dans_pdp_reseau_existant'
      WHERE item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
        AND rdc_check.id_fcu IS NULL
        AND item->'eligibility'->>'nom' IS NOT NULL
        AND item->'eligibility'->>'nom' != ''
        AND peta.geom IS NOT NULL
        AND (zec.id_fcu IS NOT NULL OR rdc2.id_fcu IS NOT NULL)
      ORDER BY peta.id, item.ordinality,
        ST_Distance(
          ST_Transform(peta.geom, 4326)::geography,
          ST_Transform(COALESCE(zec.geom, rdc2.geom), 4326)::geography
        ) NULLS LAST
    ),
    corrected_history_by_name AS (
      SELECT
        peta.id,
        jsonb_agg(
          CASE
            WHEN bnn.id_fcu_correct IS NOT NULL
            THEN jsonb_set(item, '{eligibility,id_fcu}', to_jsonb(bnn.id_fcu_correct::text), true)
            ELSE item
          END
          ORDER BY ordinality
        ) as new_history
      FROM pro_eligibility_tests_addresses peta
      CROSS JOIN LATERAL jsonb_array_elements(peta.eligibility_history) WITH ORDINALITY as item
      LEFT JOIN best_network_by_name bnn
        ON bnn.id = peta.id AND bnn.ordinality = item.ordinality
      WHERE peta.id IN (SELECT id FROM best_network_by_name)
      GROUP BY peta.id
    )
    UPDATE pro_eligibility_tests_addresses peta
    SET eligibility_history = chn.new_history
    FROM corrected_history_by_name chn
    WHERE peta.id = chn.id
  `.execute(kdb);

  return Number(result.numAffectedRows || 0);
}

/**
 * Méthode 3: Recalcul complet pour les adresses non corrigées
 * Pour les ~26 adresses restantes, recalcule l'éligibilité complète
 */
async function recalculateRemainingAddresses(): Promise<number> {
  // Récupérer les adresses PDP non corrigées
  const uncorrectedAddresses = await sql<{
    id: string;
    source_address: string;
    lat: number;
    lon: number;
  }>`
    SELECT DISTINCT
      peta.id,
      peta.source_address,
      ST_Y(ST_Transform(peta.geom, 4326)) as lat,
      ST_X(ST_Transform(peta.geom, 4326)) as lon
    FROM pro_eligibility_tests_addresses peta
    CROSS JOIN jsonb_array_elements(peta.eligibility_history) as history_item
    LEFT JOIN reseaux_de_chaleur rdc
      ON rdc."Identifiant reseau" = history_item->'eligibility'->>'id_sncu'
    WHERE history_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
      AND peta.geom IS NOT NULL
      AND rdc.id_fcu IS NULL
      AND (
        history_item->'eligibility'->>'nom' IS NULL
        OR history_item->'eligibility'->>'nom' = ''
        OR NOT EXISTS (
          SELECT 1
          FROM zones_et_reseaux_en_construction zec
          WHERE LOWER(TRIM(zec.nom_reseau)) = LOWER(TRIM(history_item->'eligibility'->>'nom'))
        )
      )
  `.execute(kdb);

  if (uncorrectedAddresses.rows.length === 0) {
    return 0;
  }

  console.log(`   Trouvé ${uncorrectedAddresses.rows.length} adresses à recalculer`);

  if (DRY_RUN) {
    return uncorrectedAddresses.rows.length;
  }

  let updated = 0;

  for (const address of uncorrectedAddresses.rows) {
    const lat = Number(address.lat);
    const lon = Number(address.lon);

    if (!lat || !lon) {
      console.warn(`   ⚠️  Adresse ${address.id} sans coordonnées valides, ignorée`);
      continue;
    }

    try {
      console.log(`   Recalcul de ${address.source_address} (${lat}, ${lon})...`);

      // Recalculer l'éligibilité en utilisant la même fonction que le reste du code
      const historyEntry = await getAddressEligibilityHistoryEntry(lat, lon);
      const newEligibility = historyEntry.eligibility;

      // Récupérer l'historique actuel
      const current = await kdb
        .selectFrom('pro_eligibility_tests_addresses')
        .select('eligibility_history')
        .where('id', '=', address.id)
        .executeTakeFirst();

      if (!current) continue;

      const history = (current.eligibility_history as EligibilityHistoryItem[]) || [];

      // Trouver et mettre à jour les entrées PDP
      const updatedHistory = history.map((item) => {
        if (item.eligibility?.type === 'dans_pdp_reseau_existant' || item.eligibility?.type === 'dans_pdp_reseau_futur') {
          return {
            ...item,
            calculated_at: new Date().toISOString(),
            eligibility: {
              ...item.eligibility, // Conserver tous les champs originaux
              communes: newEligibility.communes, // Mettre à jour les communes
              contenu_co2_acv: newEligibility.contenu_co2_acv, // Mettre à jour contenu CO2
              distance: newEligibility.distance, // Mettre à jour la distance
              eligible: newEligibility.eligible, // Mettre à jour eligible
              id_fcu: newEligibility.id_fcu, // Mettre à jour id_fcu (le bug principal)
              id_sncu: newEligibility.id_sncu, // Mettre à jour id_sncu
              nom: newEligibility.nom, // Mettre à jour le nom du réseau
              tags: newEligibility.tags, // Mettre à jour les tags
              taux_enrr: newEligibility.taux_enrr, // Mettre à jour taux EnR&R
              type: item.eligibility.type, // Préserver le type original (existant vs futur)
            },
          };
        }
        return item;
      });

      // Mettre à jour la base de données
      await kdb
        .updateTable('pro_eligibility_tests_addresses')
        .set({
          eligibility_history: JSON.stringify(updatedHistory) as any,
        })
        .where('id', '=', address.id)
        .execute();

      updated++;
      console.log(`   ✅ Recalculé: ${address.source_address}`);
    } catch (error) {
      console.error(`   ❌ Erreur pour ${address.source_address}:`, error);
    }
  }

  return updated;
}

// Exécution
main()
  .then(() => {
    console.log('\n✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
