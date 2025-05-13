import { type Command } from '@commander-js/extra-typings';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { readFileGeometry } from '@cli/helpers/geo';

import {
  createPDPFromCommune,
  insertEntityWithGeometry,
  type NetworkTable,
  updateEntityGeometry,
  updateEntityWithoutGeometry,
  updateNetworkHasPDP,
} from './geometry-operations';

const entityTypes = ['rdc', 'rdf', 'pdp', 'futur'] as const;
type EntityType = (typeof entityTypes)[number];

const entityTypeToTable = {
  rdc: 'reseaux_de_chaleur',
  rdf: 'reseaux_de_froid',
  pdp: 'zone_de_developpement_prioritaire',
  futur: 'zones_et_reseaux_en_construction',
} as const satisfies Record<EntityType, NetworkTable>;

export function registerNetworkCommands(parentProgram: Command) {
  const program = parentProgram.command('geom').description('Commandes pour gérer les géométries des données FCU (réseaux, PDP. etc)');

  program
    .command('insert')
    .description(
      "Insère une nouvelle entité avec une géométrie. Il faut avoir créé l'entité sur airtable au préalable. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)"
    )
    .argument('<type>', "type d'entité", (v) => z.enum(entityTypes).parse(v))
    .argument('<fileName>', 'input file (format GeoJSON)')
    .argument('[id_fcu]', 'id_fcu du réseau (autogénéré si non renseigné)', (v) => parseInt(v))
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
      const idValue = isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu);
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
      const idValue = isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu);
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
      const idValue = isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu);
      await updateEntityWithoutGeometry(entityTypeToTable[type], idField, idValue);
    });

  program
    .command('create-pdp-from-commune')
    .description(
      "Insère un nouveau PDP avec une géométrie basée sur les contours d'une commune. Utiliser 'yarn cli communes:search <nom>' au préalable pour obtenir le code insee"
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
