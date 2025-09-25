import fs from 'fs';

import { type Command } from '@commander-js/extra-typings';
import prompts from 'prompts';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { readFileGeometry } from '@/server/helpers/geo';
import { logger } from '@/server/helpers/logger';
import { type TrelloCard, type TrelloLabel, TrelloService } from '@/services/TrelloService';
import { runBash } from '@/utils/system';

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

const getCardPriority = (card: TrelloCard): number => {
  const labelNames = card.labels.map((label) => label.name);
  const hasReseauChaleur = labelNames.includes('Réseau chaleur');
  const hasReseauFroid = labelNames.includes('Réseau froid');
  const hasReseauConstruction = labelNames.includes('Réseau en construction');
  const hasPDP = labelNames.includes('PDP');
  const labelCount = labelNames.length;

  // 1. "Réseau chaleur" (uniquement)
  if (hasReseauChaleur && labelCount === 1) return 1;

  // 2. "Réseau en construction" (uniquement)
  if (hasReseauConstruction && labelCount === 1) return 2;

  // 3. "Réseau chaleur" (au moins)
  if (hasReseauChaleur && labelCount > 1) return 3;

  // 4. "Réseau froid" (au moins)
  if (hasReseauFroid) return 4;

  // 5. "Réseau en construction" (au moins)
  if (hasReseauConstruction && labelCount > 1) return 5;

  // 6. "PDP" (au moins)
  if (hasPDP) return 6;

  return 999;
};

export function registerNetworkCommands(parentProgram: Command) {
  const program = parentProgram.command('geom').description('Commandes pour gérer les géométries des données FCU (réseaux, PDP. etc)');

  program
    .command('trello')
    .description('Lit les cartes Trello de la colonne "Fichiers SIG dispos" et affiche leurs informations')
    .action(async () => {
      const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
      const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
      const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID || 'Tz9kOsCy';
      const TRELLO_POWER_UP_URL = 'https://trello.com/power-ups/685a9ed1a4cc64154fc1bd6d/edit/api-key';
      const COLUMN_TO_PROCESS = 'Fichiers SIG dispos';
      const COLUMN_ONGOING = 'En cours Dev';
      const COLUMN_DONE = 'Modifs faites';

      if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
        logger.error("Variables d'environnement TRELLO_API_KEY et TRELLO_TOKEN requises");
        logger.info('📋 Configuration requise :');
        logger.info(`1. Allez sur ${TRELLO_POWER_UP_URL}`);
        logger.info('2. Cliquez sur lien "Token" dans le texte à droite de "API key"');
        logger.info('3. Connectez votre compte');
        logger.info('4. Ajoutez ces variables à votre fichier .env.local :');
        logger.info('   TRELLO_API_KEY=votre_api_key');
        logger.info('   TRELLO_TOKEN=votre_token');
        logger.info('   TRELLO_BOARD_ID=Tz9kOsCy (optionnel)');
        process.exit(1);
      }

      void runBash('open http://localhost:3000/carte');
      void runBash('open .');

      try {
        const trelloService = new TrelloService(TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID);

        await trelloService.testConnection();
        logger.info('✅ Connexion à Trello API réussie');

        const cards = await trelloService.getCardsInColumnByName(COLUMN_TO_PROCESS);

        if (cards.length === 0) {
          logger.info(`Aucune carte trouvée dans la colonne "${COLUMN_TO_PROCESS}"`);
          return;
        }

        logger.info(`\n📋 ${cards.length} carte(s) trouvée(s) dans "${COLUMN_TO_PROCESS}":\n`);

        const sortedCards = cards
          .filter((card) => card.attachments.some((attachment) => attachment.fileName.endsWith('.geojson')))
          .sort((a, b) => getCardPriority(a) - getCardPriority(b));

        const colorizeLabel = (label: TrelloLabel): string => {
          const colorMap: Record<string, string> = {
            green_dark: '\x1b[32m', // réseaux de chaleur
            blue_dark: '\x1b[34m', // réseaux de froid
            pink: '\x1b[95m', // réseaux en construction
            yellow: '\x1b[33m', // PDP
          };
          const reset = '\x1b[0m';
          const color = colorMap[label.color] || '';
          return `${color}${label.name}${reset}`;
        };

        logger.info(`🔄 Cartes triées par priorité de labels`);

        for (const card of sortedCards) {
          const name = card.name;
          const labels = card.labels.map(colorizeLabel).join(', ');
          const onlyOneLabel = card.labels.length === 1;
          const suggestedId = onlyOneLabel ? name.match(/ID\s*(?:FCU\s*)?(\d+[CF]?)/)?.[1] : undefined;
          const isIdSNCU = suggestedId?.endsWith('C') || suggestedId?.endsWith('F');
          const attachmentUrls = card.attachments.filter((attachment) => attachment.fileName.endsWith('.geojson'));
          const suggestedEntityType = onlyOneLabel
            ? card.labels.find((label) => label.name === 'Réseau chaleur')
              ? 'rdc'
              : card.labels.find((label) => label.name === 'Réseau froid')
                ? 'rdf'
                : card.labels.find((label) => label.name === 'PDP')
                  ? 'pdp'
                  : card.labels.find((label) => label.name === 'Réseau en construction')
                    ? 'futur'
                    : undefined
            : undefined;

          const nameLc = name.toLowerCase();
          const suggestedAction = onlyOneLabel
            ? nameLc.startsWith('crea')
              ? 'insert'
              : nameLc.includes('extension')
                ? 'extend'
                : nameLc.includes('maj')
                  ? 'update'
                  : undefined
            : undefined;
          logger.info(`══════════════════════════`);
          logger.info(labels);
          logger.info(`# ${name}`);
          logger.info(
            [
              card.desc,
              `Suggested Entity Type: ${suggestedEntityType}\nSuggested Action: ${suggestedAction}\nSuggested ID: ${suggestedId}`,
            ].join('\n\n')
          );
          logger.info(`══════════════════════════`);

          await trelloService.moveCardInColumnByName(card.id, COLUMN_ONGOING);

          const localPaths = await trelloService.downloadAttachments(attachmentUrls);

          for (const localPath of localPaths) {
            try {
              logger.info(`Drag n drop le fichier ${localPath} dans la carte`);
              const { entityType } = await prompts({
                type: 'select',
                name: 'entityType',
                message: "Sélectionnez le type d'entité :",
                hint: suggestedEntityType,
                choices: [
                  { title: 'Réseau de chaleur (rdc)', value: 'rdc' },
                  { title: 'Réseau de froid (rdf)', value: 'rdf' },
                  { title: 'Plan de développement (pdp)', value: 'pdp' },
                  { title: 'Réseau futur (futur)', value: 'futur' },
                  { title: 'Passer', value: 'skip' },
                ],
              });
              if (entityType === 'skip') {
                logger.info('👌 Action passée');
                fs.unlinkSync(localPath);
                logger.debug('🧹 Fichier temporaire supprimé');
                continue;
              }

              const { action } = await prompts({
                type: 'select',
                name: 'action',
                message: "Sélectionnez l'action à effectuer :",
                hint: suggestedAction,
                choices: [
                  { title: 'Insérer une nouvelle entité', value: 'insert' },
                  { title: 'Mettre à jour la géométrie', value: 'update' },
                  { title: 'Étendre la géométrie', value: 'extend' },
                  { title: "Supprimer l'entité", value: 'remove' },
                ],
              });

              const { id_fcu_or_sncu } = await prompts({
                type: 'text',
                name: 'id_fcu_or_sncu',
                hint: suggestedId,
                message: "Entrez l'ID FCU ou SNCU :",
                validate: (value) => (value.length > 0 ? true : "L'ID est requis"),
              });

              if (!action || !entityType || !id_fcu_or_sncu) {
                logger.info('❌ Action, type ou ID manquant');
                await trelloService.moveCardInColumnByName(card.id, COLUMN_TO_PROCESS);
                process.exit(1);
              }

              if (action === 'remove') {
                logger.warn('⚠️ La suppression nécessite une intervention manuelle en base de données');
                logger.info(`Exécutez cette requête SQL :`);
                logger.info(
                  `DELETE FROM ${entityTypeToTable[entityType as EntityType]} WHERE ${isIdSNCU ? 'Identifiant reseau' : 'id_fcu'} = ${id_fcu_or_sncu}`
                );
              } else {
                let command: string;
                switch (action) {
                  case 'insert':
                    command = `pnpm cli geom insert ${entityType} ${localPath} ${id_fcu_or_sncu}`;
                    break;
                  case 'update':
                    command = `pnpm cli geom update ${entityType} ${localPath} ${id_fcu_or_sncu}`;
                    break;
                  case 'extend':
                    command = `pnpm cli geom extend ${entityType} ${localPath} ${id_fcu_or_sncu}`;
                    break;
                  default:
                    throw new Error(`Action non reconnue: ${action}`);
                }

                logger.debug(`🚀 Exécution: ${command}`);
                await runBash(command);
                logger.debug('✅ Action terminée avec succès');

                fs.unlinkSync(localPath);
                logger.debug('🧹 Fichier temporaire supprimé');
              }
            } catch (error) {
              logger.error(`❌ Erreur lors du traitement de ${localPath}:`, error);
            }
          }
          await trelloService.moveCardInColumnByName(card.id, COLUMN_DONE);
        }
      } catch (error) {
        logger.error('Erreur lors de la récupération des cartes Trello:', error);
        if (error instanceof Error && error.message.includes('400')) {
          logger.info('');
          logger.info('💡 Conseils de dépannage :');
          logger.info('- Vérifiez que votre API key et token sont valides');
          logger.info('- Assurez-vous que votre token a les bonnes permissions');
          logger.info(`- Régénérez votre token sur ${TRELLO_POWER_UP_URL}`);
        }
        process.exit(1);
      }
    });

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
