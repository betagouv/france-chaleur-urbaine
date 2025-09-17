import { spawn } from 'node:child_process';

import { serverConfig } from '@/server/config';
import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('diagnostic');

export async function runDiagnostic() {
  return {
    geo: await checkGeoCommands(),
  };
}

/**
 * Teste l'existence d'une commande système en exécutant `command --version`
 * @param command - Le nom de la commande à tester
 * @returns Un objet avec le statut de la commande et la sortie complète
 */
async function testCommandExists(command: string): Promise<{ exists: boolean; output: string }> {
  return new Promise((resolve) => {
    const process = spawn(command, ['--version'], {
      stdio: 'pipe',
      shell: true,
    });

    let hasOutput = false;
    let output = '';

    process.stdout.on('data', (data) => {
      hasOutput = true;
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      hasOutput = true;
      output += data.toString();
    });

    // Timeout après 2 secondes - plus court car on veut juste vérifier que la commande existe
    const timeout = setTimeout(() => {
      process.kill();
      logger.error(`Timeout lors du test de la commande ${command}`, { command });
      resolve({
        exists: false,
        output: 'Timeout lors de la vérification de la commande',
      });
    }, 2000);

    process.on('close', (code) => {
      clearTimeout(timeout);
      const exists = code === 0;
      logger.info(`Test de la commande ${command}: ${exists ? 'trouvée' : 'non trouvée'}`, {
        command,
        exitCode: code,
        hasOutput,
        output: output.substring(0, 100), // Log seulement les 100 premiers caractères
      });
      resolve({
        exists,
        output: output.trim() || `Commande non trouvée (code: ${code})`,
      });
    });

    process.on('error', (err) => {
      clearTimeout(timeout);
      logger.error(`Erreur lors du test de la commande ${command}`, { command, error: err.message });
      resolve({
        exists: false,
        output: `Erreur: ${err.message}`,
      });
    });
  });
}

export async function checkGeoCommands() {
  logger.info('Vérification des commandes géographiques...');

  const [ogr2ogr, tippecanoe] = await Promise.all([testCommandExists('ogr2ogr'), testCommandExists('tippecanoe')]);

  return {
    USE_DOCKER_GEO_COMMANDS: serverConfig.USE_DOCKER_GEO_COMMANDS,
    ogr2ogr,
    tippecanoe,
  };
}
