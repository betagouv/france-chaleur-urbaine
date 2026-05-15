import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

import type { Command } from '@commander-js/extra-typings';
import camelcase from 'camelcase';
import { z } from 'zod';

import { logger } from '@/server/helpers/logger';
import { nonEmptyArray, ObjectKeys } from '@/utils/typescript';

import { runTilesGeneration } from './server/generation-run';
import { markTilesUpdated } from './server/service';
import { type TilesType, tileSourcesConfig, tilesTypes, zTileSourceId } from './server/tiles.config';

/**
 * Enregistre les commandes CLI pour la gestion des tuiles vectorielles
 */
export function registerTilesCommands(parentProgram: Command) {
  const tilesCommand = parentProgram.command('tiles').description('Commandes pour la gestion des tuiles vectorielles');

  tilesCommand
    .command('generate')
    .description('Génère des tuiles vectorielles pour une ressource')
    .argument('<type>', `Type de ressource à générer - ${tilesTypes.join(', ')}`, (v) => z.enum(nonEmptyArray(tilesTypes)).parse(v))
    .option('--input <file>', 'Path of the file to import from')
    .action(async (type: TilesType, options: { input?: string }) => {
      logger.info(`Génération du fichier GeoJSON pour ${type}`);
      const config = await runTilesGeneration(type, options.input);
      logger.info(`La table ${config.tilesTableName} a été populée avec les données pour ${type}.`);
      logger.warn(`N'oubliez pas`);
      logger.warn(`- de l'ajouter à la carte pnpm cli tiles add-to-map ${type}`);
      logger.warn(`- de copier la table sur dev et prod`);
      logger.warn(`pnpm db:push:dev --data-only ${config.tilesTableName}`);
      logger.warn(`pnpm db:push:prod --data-only ${config.tilesTableName}`);
    });

  tilesCommand
    .command('bump')
    .description('Marque une source de tuiles comme mise à jour (invalide le cache HTTP côté navigateur)')
    .argument('<source-id>', `Identifiant de la source à bumper ou "all" - ${ObjectKeys(tileSourcesConfig).join(', ')}`, (v) =>
      z.union([z.literal('all'), zTileSourceId]).parse(v)
    )
    .action(async (sourceId) => {
      if (sourceId === 'all') {
        const allSourceIds = ObjectKeys(tileSourcesConfig);
        await Promise.all(allSourceIds.map(markTilesUpdated));
        logger.info(`${allSourceIds.length} sources de tuiles bumpées`);
        return;
      }
      await markTilesUpdated(sourceId);
      logger.info(`Source ${sourceId} bumpée`);
    });

  tilesCommand
    .command('add-to-map')
    .description('Quand les tiles sont en BDD, il faut les afficher sur la carte. Voici une description des actions à faire')
    .argument('<type>', `Type de ressource à générer - ${tilesTypes.join(', ')}`, (v) => z.enum(nonEmptyArray(tilesTypes)).parse(v))
    .action(async (type: TilesType) => {
      await generateAddToMapInstructions(type);
    });
}

/**
 * Génère les instructions pour ajouter une couche de tuiles à la carte
 */
async function generateAddToMapInstructions(type: TilesType): Promise<void> {
  logger.info(
    `Plusieurs actions manuelles à faire pour générer la couche ${type}. Vous pouvez voir https://github.com/betagouv/france-chaleur-urbaine/pull/991/files pour référence`
  );

  const typeCamelCase = camelcase(type);
  const layerFilePath = `src/components/Map/layers/${typeCamelCase}.tsx`;
  const mapConfigurationFilePath = `src/components/Map/map-configuration.ts`;
  const mapLayersFilePath = `src/components/Map/map-layers.ts`;
  const mapFilePath = `src/pages/carte.tsx`;
  const tilesConfigFilePath = `src/modules/tiles/server/tiles.config.ts`;
  const analyticsFilePath = `src/modules/analytics/analytics.config.ts`;
  const simpleMapLegendFilePath = `src/components/Map/components/SimpleMapLegend.tsx`;

  // Instructions pour chaque fichier
  logger.info(`Dans ${tilesConfigFilePath}`);
  logger.warn(`  🚧 Ajouter la config à tileSourcesConfig -> "'${type}': { ... }"`);
  logger.warn(`  🚧 Choisir la stratégie de génération (generateGeoJSON) parmi :`);
  logger.warn(`     - extractGeoJSONFromDatabaseTable(tableName) : extraction simple d'une table`);
  logger.warn(`     - extractNDJSONFromDatabaseTable(tableName, { fields, idField }) : extraction optimisée pour grosses tables`);
  logger.warn(`     - downloadGeoJSONFromURL(url, mapFilterFeature?) : téléchargement + transformation optionnelle`);
  logger.warn(`     - extractZippedShapefileToGeoJSON : extraction d'un shapefile depuis un ZIP (--input requis)`);
  logger.warn(`     - getInputFilePath : utilise le fichier fourni en --input`);
  logger.warn(`     - generateGeoJSONFromSQLQuery(query, mapFunction) : requête SQL personnalisée`);
  logger.warn(`  🚧 Configurer les options : tilesTableName, compressedTiles, tippeCanoeArgs, zoomMin, zoomMax`);

  logger.info(`Dans ${mapConfigurationFilePath}`);
  logger.warn(`  🚧 Ajouter la config au type MapConfiguration -> "${typeCamelCase}: boolean"`);
  logger.warn(`  🚧 Ajouter la config à emptyMapConfiguration -> "${typeCamelCase}: false"`);

  logger.info(`Dans ${layerFilePath}`);
  if (!existsSync(layerFilePath)) {
    await writeFile(
      layerFilePath,
      `// Check in other layers for the structure
export const ${typeCamelCase}LayersSpec = [];`
    );
    logger.info(`✅ Fichier layer créé dans ${layerFilePath}`);
  }
  logger.warn(`  🚧 Modifier le fichier layer`);

  logger.info(`Dans ${mapLayersFilePath}`);
  logger.warn(`  🚧 Importer dans mapLayers -> "...${typeCamelCase}LayersSpec,"`);

  logger.info(`Dans ${mapFilePath}`);
  logger.warn(`  🚧 Ajouter la config à layerURLKeysToMapConfigPath -> "${typeCamelCase}: '${typeCamelCase}'"`);

  logger.info(`Dans ${analyticsFilePath}`);
  logger.warn(`  🚧 Ajouter les events analytics`);

  logger.info(`Dans ${simpleMapLegendFilePath}`);
  logger.warn(`  🚧 Ajouter une nouvelle checkbox`);
  logger.info('');
  logger.info('Pour ouvrir tous les fichiers, vous pouvez faire :');
  logger.info(
    `code ${[tilesConfigFilePath, mapConfigurationFilePath, layerFilePath, mapLayersFilePath, mapFilePath, analyticsFilePath, simpleMapLegendFilePath].join(' ')}`
  );
}
