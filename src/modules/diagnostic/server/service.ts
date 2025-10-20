import { access, constants, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { knownAirtableBases } from '@cli/airtable/bases';
import { generateTilesFromGeoJSONDockerLegacy, runTippecanoe } from '@/modules/tiles/server/generation-import';
import { serverConfig } from '@/server/config';
import { createLogger } from '@/server/helpers/logger';
import { stringifySorted } from '@/utils/objects';
import { ogr2ogrConvertToGeoJSON, runOgr2ogr } from '@/utils/ogr2ogr';

const logger = createLogger('diagnostic');

export async function runDiagnostic() {
  return {
    airtable: getAirtableBase(),
    geo: await checkGeoCommands(),
  };
}

async function checkGeoCommands() {
  logger.info('Vérification des commandes géographiques...');

  const [ogr2ogrVersion, ogr2ogrFunctional, tippecanoeVersion, tippecanoeFunctional] = await Promise.all([
    runOgr2ogr('--version', { captureOutput: true }),
    testOgr2ogrFunctional(),
    runTippecanoe('--version', { captureOutput: true }),
    testTippecanoeFunctional(),
  ]);

  return {
    ogr2ogr: {
      functional: ogr2ogrFunctional,
      version: ogr2ogrVersion,
    },
    tippecanoe: {
      functional: tippecanoeFunctional,
      version: tippecanoeVersion,
    },
    USE_DOCKER_GEO_COMMANDS: serverConfig.USE_DOCKER_GEO_COMMANDS,
  };
}

const testGeoJSON = {
  features: [
    {
      geometry: {
        coordinates: [2.3522, 48.8566], // Paris
        type: 'Point',
      },
      properties: {
        name: 'Test Point',
      },
      type: 'Feature',
    },
  ],
  type: 'FeatureCollection',
};

export type CommandTestResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Test fonctionnel d'ogr2ogr
 */
async function testOgr2ogrFunctional(): Promise<CommandTestResult> {
  const tempDir = await mkdtemp(join(tmpdir(), 'diagnostic-ogr2ogr-'));
  try {
    const inputFilePath = join(tempDir, 'test-input.geojson');
    const outputFilePath = join(tempDir, 'test-output.geojson');

    await writeFile(inputFilePath, JSON.stringify(testGeoJSON));

    await ogr2ogrConvertToGeoJSON(inputFilePath, outputFilePath);

    try {
      await access(outputFilePath, constants.R_OK);
    } catch {
      throw new Error("Le fichier de sortie n'a pas été créé par ogr2ogr");
    }

    const outputFileContent = await readFile(outputFilePath);
    const outputCollection = JSON.parse(outputFileContent.toString());
    if (stringifySorted(outputCollection.features[0]) !== stringifySorted(testGeoJSON.features[0])) {
      logger.error("Le contenu du fichier de sortie n'est pas identique au fichier d'entrée", {
        outputFileContent: outputCollection.features[0],
        tippecanoeTestGeoJSON: testGeoJSON.features[0],
      });
      throw new Error("Le contenu du fichier de sortie n'est pas identique au fichier d'entrée");
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors du test ogr2ogr';
    logger.error('Échec du test fonctionnel ogr2ogr', { error: errorMessage });
    return { error: errorMessage, success: false };
  } finally {
    // cleanup
    await rm(tempDir, { force: true, recursive: true });
  }
}

/**
 * Test fonctionnel de tippecanoe
 */
async function testTippecanoeFunctional(): Promise<CommandTestResult> {
  const tempDir = await mkdtemp(join(tmpdir(), 'diagnostic-tippecanoe-'));
  try {
    const inputFile = join(tempDir, 'test-input.geojson');
    const outputDir = join(tempDir, 'tiles');

    await writeFile(inputFile, JSON.stringify(testGeoJSON));

    await generateTilesFromGeoJSONDockerLegacy({
      geojsonConfig: inputFile,
      outputDirectory: outputDir,
      zoomMax: 6, // Limité pour le test
      zoomMin: 5,
    });

    try {
      await access(outputDir, constants.R_OK);
    } catch {
      throw new Error("Le répertoire de tuiles n'a pas été créé par tippecanoe");
    }

    const expectedDirectories = ['5', '6'];
    for (const dir of expectedDirectories) {
      try {
        await access(join(outputDir, dir), constants.R_OK);
      } catch {
        throw new Error(`Le répertoire${dir} n'a pas été généré par tippecanoe`);
      }
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors du test tippecanoe';
    logger.error('Échec du test fonctionnel tippecanoe', { error: errorMessage });
    return { error: errorMessage, success: false };
  } finally {
    // cleanup
    await rm(tempDir, { force: true, recursive: true });
  }
}

function getAirtableBase(): string {
  return (
    Object.entries(knownAirtableBases).find(([_, value]) => value === serverConfig.AIRTABLE_BASE)?.[0] ||
    `inconnu ${serverConfig.AIRTABLE_BASE}`
  );
}
