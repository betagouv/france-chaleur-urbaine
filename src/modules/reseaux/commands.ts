import type { Command } from '@commander-js/extra-typings';
import { z } from 'zod';

import { readFileGeometry } from '@/modules/geo/server/helpers';
import { identifyNetworkGeometries } from '@/modules/reseaux/server/geometry-identify';
import { AirtableDB } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';

import { applyNetworkGeometries } from './server/geometry-apply';
import { diffNetworkGeometries } from './server/geometry-diff';
import {
  createPDPFromCommune,
  insertEntityWithGeometry,
  type NetworkTable,
  updateEntityGeometry,
  updateEntityWithoutGeometry,
  updateNetworkHasPDP,
} from './server/geometry-operations';
import { syncLinkedNetworkFields } from './server/linked-fields-sync';

const entityTypes = ['rdc', 'rdf', 'pdp', 'futur'] as const;
type EntityType = (typeof entityTypes)[number];

const entityTypeToTable = {
  futur: 'zones_et_reseaux_en_construction',
  pdp: 'zone_de_developpement_prioritaire',
  rdc: 'reseaux_de_chaleur',
  rdf: 'reseaux_de_froid',
} as const satisfies Record<EntityType, NetworkTable>;

export function registerNetworkCommands(parentProgram: Command) {
  parentProgram
    .command('reseaux:sync-linked-fields')
    .description('Resynchronise les champs dérivés des liens entre entités (SNCU des extensions, gestionnaire/MO des PDP)')
    .action(async () => {
      const stats = await syncLinkedNetworkFields();
      logger.info('synchronisation des champs liés terminée', stats);
    });

  // Reprise one-off (suppression prévue une fois jouée en prod) : déduit le lien extension → RC
  // depuis le champ Airtable « Commentaires », qui contient entre autres un identifiant SNCU.
  // Règle : ne rien prendre si 0 ou plusieurs SNCU distincts, ne jamais écraser un lien existant.
  parentProgram
    .command('reseaux:extract-construction-links')
    .description('Reprise one-off des liens réseau en construction → réseau de chaleur depuis le champ Airtable « Commentaires »')
    .option('--dry-run', 'Affiche les liens détectés sans les appliquer', false)
    .action(async ({ dryRun }) => {
      const [records, reseauxDeChaleur, constructions] = await Promise.all([
        AirtableDB(Airtable.FUTUR_NETWORKS).select().all(),
        kdb
          .selectFrom('reseaux_de_chaleur')
          .select(['id_fcu', 'Identifiant reseau'])
          .where('Identifiant reseau', 'is not', null)
          .where('Identifiant reseau', '!=', '')
          .execute(),
        kdb.selectFrom('zones_et_reseaux_en_construction').select(['id_fcu', 'reseau_de_chaleur_id']).execute(),
      ]);
      const reseauDeChaleurIdBySncu = new Map(reseauxDeChaleur.map((reseau) => [reseau['Identifiant reseau'], reseau.id_fcu]));
      const constructionById = new Map(constructions.map((construction) => [construction.id_fcu, construction]));

      const stats = { alreadyLinked: 0, ambiguous: 0, linked: 0, noMatch: 0, noSncu: 0 };
      for (const record of records) {
        const idFcu = record.get('id_fcu') as number | undefined;
        const commentaires = record.get('Commentaires') as string | undefined;
        const construction = idFcu !== undefined ? constructionById.get(idFcu) : undefined;
        if (!construction) {
          continue;
        }
        const sncuIds = [...new Set(commentaires?.match(/\b\d{3,4}[A-Z]\b/g) ?? [])];
        if (sncuIds.length === 0) {
          stats.noSncu++;
          continue;
        }
        if (sncuIds.length > 1) {
          stats.ambiguous++;
          logger.warn(`réseau en construction #${idFcu} : plusieurs SNCU trouvés (${sncuIds.join(', ')}) → ignoré`);
          continue;
        }
        if (construction.reseau_de_chaleur_id !== null) {
          stats.alreadyLinked++;
          continue;
        }
        const reseauDeChaleurId = reseauDeChaleurIdBySncu.get(sncuIds[0]);
        if (reseauDeChaleurId === undefined) {
          stats.noMatch++;
          logger.warn(`réseau en construction #${idFcu} : aucun réseau de chaleur avec le SNCU ${sncuIds[0]}`);
          continue;
        }
        logger.info(
          `réseau en construction #${idFcu} → réseau de chaleur #${reseauDeChaleurId} (SNCU ${sncuIds[0]})${dryRun ? ' (dry-run)' : ''}`
        );
        if (!dryRun) {
          await kdb
            .updateTable('zones_et_reseaux_en_construction')
            .set({ reseau_de_chaleur_id: reseauDeChaleurId })
            .where('id_fcu', '=', idFcu as number)
            .execute();
        }
        stats.linked++;
      }
      // Recopie SNCU/nom/gestionnaire/MO sur les extensions nouvellement liées
      if (!dryRun && stats.linked > 0) {
        await syncLinkedNetworkFields();
      }
      logger.info('extraction des liens terminée', stats);
    });

  // Reprise one-off (suppression prévue une fois jouée en prod) : récupère la date de création
  // des réseaux en construction depuis le champ Airtable « Date de création / mise en ligne »
  parentProgram
    .command('reseaux:import-construction-created-at')
    .description('Reprise one-off des dates de création des réseaux en construction depuis Airtable')
    .option('--dry-run', 'Affiche les mises à jour sans les appliquer', false)
    .action(async ({ dryRun }) => {
      const records = await AirtableDB(Airtable.FUTUR_NETWORKS).select().all();
      let updated = 0;
      let skipped = 0;
      for (const record of records) {
        const idFcu = record.get('id_fcu') as number | undefined;
        const createdAt = record.get('Date de création / mise en ligne') as string | undefined;
        if (!idFcu || !createdAt) {
          skipped++;
          continue;
        }
        logger.info(`réseau en construction #${idFcu} → created_at = ${createdAt}${dryRun ? ' (dry-run)' : ''}`);
        if (!dryRun) {
          await kdb
            .updateTable('zones_et_reseaux_en_construction')
            .set({ created_at: new Date(createdAt) })
            .where('id_fcu', '=', idFcu)
            .execute();
        }
        updated++;
      }
      logger.info('reprise des dates de création terminée', { skipped, updated });
    });

  const program = parentProgram.command('geom').description('Commandes pour gérer les géométries des données FCU (réseaux, PDP. etc)');

  program
    .command('insert')
    .description(
      "Insère une nouvelle entité avec une géométrie. Il faut avoir créé l'entité sur airtable au préalable. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)"
    )
    .argument('<type>', "type d'entité", (v) => z.enum(entityTypes).parse(v))
    .argument('<fileName>', 'input file (format GeoJSON)')
    .argument('[id_fcu]', 'id_fcu du réseau (autogénéré si non renseigné)', (v) => z.coerce.number().parse(v))
    .argument('[id_sncu]', 'Identifiant du réseau (seulement pour les réseaux de chaleur et de froid)')
    .action(async (type, fileName, id_fcu, id_sncu) => {
      const geometryConfig = await readFileGeometry(fileName);
      await insertEntityWithGeometry(entityTypeToTable[type], geometryConfig, { id_fcu, id_sncu });

      if (type === 'pdp' && id_sncu) {
        await updateNetworkHasPDP(id_sncu);
      }
    });

  program
    .command('extend')
    .description("Etend la géométrie d'une entité. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)")
    .argument('<type>', "type d'entité", (v) => z.enum(entityTypes).parse(v))
    .argument('<fileName>', 'input file (format GeoJSON)')
    .argument('<id_fcu_or_sncu>', 'id_fcu ou SNCU du réseau')
    .action(async (type, fileName, id_fcu_or_sncu) => {
      const isIdSNCU = id_fcu_or_sncu.endsWith('C') || id_fcu_or_sncu.endsWith('F');
      const idField = isIdSNCU ? 'Identifiant reseau' : 'id_fcu';
      const idValue = isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu, 10);
      const geometryConfig = await readFileGeometry(fileName);
      await updateEntityGeometry(entityTypeToTable[type], idField, idValue, geometryConfig, { extend: true });
    });

  program
    .command('update')
    .description("Met à jour la géométrie d'une entité. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)")
    .argument('<type>', "type d'entité", (v) => z.enum(entityTypes).parse(v))
    .argument('<fileName>', 'input file (format GeoJSON)')
    .argument('<id_fcu_or_sncu>', 'id_fcu ou SNCU du réseau')
    .action(async (type, fileName, id_fcu_or_sncu) => {
      const isIdSNCU = id_fcu_or_sncu.endsWith('C') || id_fcu_or_sncu.endsWith('F');
      const idField = isIdSNCU ? 'Identifiant reseau' : 'id_fcu';
      const idValue = isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu, 10);
      const geometryConfig = await readFileGeometry(fileName);
      await updateEntityGeometry(entityTypeToTable[type], idField, idValue, geometryConfig);
    });

  program
    .command('refresh-infos')
    .description("Met à jour les informations d'une entité sans modifier sa géométrie (communes, départements, etc.)")
    .argument('<type>', "type d'entité", (v) => z.enum(entityTypes).parse(v))
    .argument('<id_fcu_or_sncu>', 'id_fcu ou SNCU du réseau')
    .action(async (type, id_fcu_or_sncu) => {
      const isIdSNCU = id_fcu_or_sncu.endsWith('C') || id_fcu_or_sncu.endsWith('F');
      const idField = isIdSNCU ? 'Identifiant reseau' : 'id_fcu';
      const idValue = isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu, 10);
      await updateEntityWithoutGeometry(entityTypeToTable[type], idField, idValue);
    });

  program
    .command('diff')
    .description("Compare les fichiers GeoJSON d'un répertoire (nommés <id_sncu>.geojson) avec les tracés en base et écrit un rapport CSV.")
    .argument('<directory>', 'Répertoire contenant les fichiers <id_sncu>.geojson')
    .argument('[output]', 'Chemin du fichier CSV de sortie', 'geometry-diff.csv')
    .action(async (directory, output) => {
      await diffNetworkGeometries(directory, output);
    });

  program
    .command('bulk-update')
    .description(
      "Met à jour (ou crée) les tracés des réseaux de chaleur/froid à partir d'un répertoire de <id_sncu>.geojson. Les réseaux absents de la BDD sont créés en récupérant leur id_fcu depuis Airtable. Skip les fichiers vides."
    )
    .argument('<directory>', 'Répertoire contenant les fichiers <id_sncu>.geojson')
    .option('--apply', 'Applique réellement les mises à jour (par défaut: dry-run)', false)
    .action(async (directory, { apply }) => {
      await applyNetworkGeometries(directory, { dryRun: !apply });
    });

  program
    .command('identify')
    .description(
      "Identifie l'id SNCU de fichiers KML/GeoJSON (nommés par ville) par overlap géométrique avec les réseaux existants, et écrit un rapport CSV de scoring."
    )
    .argument('<directory>', 'Répertoire contenant les fichiers .kml / .geojson')
    .argument('[output]', 'Chemin du fichier CSV de sortie', 'network-identify.csv')
    .option(
      '--write <dir>',
      'Convertit et écrit tous les fichiers en GeoJSON : <id_sncu>.geojson si un réseau est identifié, <nom_original>.geojson sinon. Supprimer les fichiers indésirables puis lancer bulk-update.'
    )
    .option('--min-score <n>', 'Score minimal (0-100) pour considérer un match comme fort', '50')
    .option('--max-distance <m>', 'Distance de recherche des réseaux candidats en mètres', '300')
    .action(async (directory, output, { write, minScore, maxDistance }) => {
      await identifyNetworkGeometries(directory, {
        maxDistance: parseFloat(maxDistance),
        minScore: parseFloat(minScore),
        outputPath: output,
        writeDir: write,
      });
    });

  program
    .command('create-pdp-from-commune')
    .description(
      "Insère un nouveau PDP avec une géométrie basée sur les contours d'une commune. Utiliser 'pnpm cli communes:search <nom>' au préalable pour obtenir le code insee"
    )
    .argument('<code_insee>', 'code insee de la commune')
    .argument('[id_sncu]', 'ID SNCU (identifiant réseau)')
    .action(async (code_insee, id_sncu) => {
      await createPDPFromCommune(code_insee, id_sncu);
    });

  program
    .command('update-communes')
    .description(
      "Met à jour les communes des tables réseaux de chaleur / froid / en construction, pdp grâce aux coutours des communes de l'IGN."
    )
    .action(async () => {
      // 1. MAJ communes_insee avec les codes communes
      const updateTableCommunesInsee = (table: NetworkTable) => sql`
        update ${sql.raw(table)}
        set communes_insee = COALESCE(
          (
            SELECT array_agg(insee_com order by insee_com)
            FROM ign_communes
            WHERE ST_Intersects(${sql.raw(table)}.geom, ign_communes.geom_150m)
          ),
          (
            SELECT array_agg(insee_com order by insee_com)
            FROM ign_communes
            WHERE ST_Intersects(${sql.raw(table)}.geom, ign_communes.geom)
          ),
          '{}'
        )::text[]
      `;

      await Promise.all(
        Object.values(entityTypeToTable).map(async (table) => {
          const res = await updateTableCommunesInsee(table).execute(kdb);
          logger.info(`Mise à jour de ${table}: ${res.numAffectedRows} lignes modifiées`);
        })
      );

      // 2. MAJ des labels communes, départements et régions
      const updateTableLabels = async (table: NetworkTable) => {
        return await kdb
          .updateTable(table)
          .set({
            communes: sql<string[]>`ARRAY(
              SELECT DISTINCT ic.nom
              FROM unnest(${sql.raw(table)}.communes_insee) as ci
              JOIN ign_communes ic ON ic.insee_com = ci
              ORDER BY ic.nom
            )`,
            departement: sql<string>`(
              SELECT string_agg(DISTINCT id.nom, ', ' ORDER BY id.nom)
              FROM unnest(${sql.raw(table)}.communes_insee) as ci
              JOIN ign_communes ic ON ic.insee_com = ci
              JOIN ign_departements id ON id.insee_dep = ic.insee_dep
            )`,
            region: sql<string>`(
              SELECT string_agg(DISTINCT ir.nom, ', ' ORDER BY ir.nom)
              FROM unnest(${sql.raw(table)}.communes_insee) as ci
              JOIN ign_communes ic ON ic.insee_com = ci
              JOIN ign_regions ir ON ir.insee_reg = ic.insee_reg
            )`,
          })
          .executeTakeFirstOrThrow();
      };

      await Promise.all(
        Object.values(entityTypeToTable).map(async (table) => {
          const res = await updateTableLabels(table);
          logger.info(`Mise à jour des labels pour ${table}: ${res.numUpdatedRows} lignes modifiées`);
        })
      );
    });
}
