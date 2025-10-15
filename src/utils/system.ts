import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { copyFile, readdir, stat, unlink } from 'node:fs/promises';
import { arch } from 'node:os';
import { join } from 'node:path';

import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('system');

export type RunCommandOptions = {
  /** Si true, capture et retourne la sortie. Si false, affiche la sortie dans le terminal */
  captureOutput?: boolean;
  /** Répertoire de travail pour la commande */
  cwd?: string;
};

/**
 * Exécute une commande avec les arguments fournis.
 *
 * @param executablePath - Chemin vers l'exécutable à lancer
 * @param args - Arguments à passer à la commande
 * @param options - Options d'exécution
 * @returns Une promesse qui se résout avec le résultat de la commande si captureOutput est true, sinon void
 */
export async function runCommand(executablePath: string, args: string[] = [], options: RunCommandOptions = {}): Promise<CommandResult> {
  const { captureOutput = false, cwd } = options;

  logger.info(`Running command: ${executablePath} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const stdio = captureOutput ? 'pipe' : 'inherit';
    const process = spawn(executablePath, args, { cwd, stdio });

    let output = '';

    if (captureOutput) {
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        output += data.toString();
      });
    }

    process.on('close', (code) => {
      if (captureOutput) {
        resolve({
          output: output.trim(),
          success: code === 0,
        });
      } else {
        if (code === 0) {
          resolve({
            output: '',
            success: true,
          });
        } else {
          reject(new Error(`Script exited with code ${code}`));
        }
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

export type CommandResult = {
  success: boolean;
  output: string;
};

/**
 * Teste la version d'une commande système en exécutant `command --version`
 * @param command - Le nom de la commande à tester
 * @returns Un objet avec le statut de la commande et la version
 */
export async function testCommand(command: string, args: string[] = []): Promise<CommandResult> {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      shell: true,
      stdio: 'pipe',
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
        output: 'Timeout lors de la vérification de la commande',
        success: false,
      });
    }, 2000);

    process.on('close', (code) => {
      clearTimeout(timeout);
      const success = code === 0;
      logger.info(`Test de la commande ${command}: ${success ? 'trouvée' : 'non trouvée'}`, {
        command,
        exitCode: code,
        hasOutput,
        output: output.substring(0, 100), // Log seulement les 100 premiers caractères
      });
      resolve({
        output: output.trim() || `Commande non trouvée (code: ${code})`,
        success,
      });
    });

    process.on('error', (err) => {
      clearTimeout(timeout);
      logger.error(`Erreur lors du test de la commande ${command}`, { command, error: err.message });
      resolve({
        output: err.message,
        success: false,
      });
    });
  });
}

/**
 * Exécute une commande bash
 *
 * @param command - Commande bash à exécuter
 * @param options - Options d'exécution
 * @returns Une promesse qui se résout avec le résultat de la commande si captureOutput est true, sinon void
 */
export function runBash(command: string, options: RunCommandOptions = {}): Promise<CommandResult> {
  return runCommand('bash', ['-c', command], options);
}

export const dockerImageArch =
  arch() === 'arm64'
    ? 'arm64'
    : arch() === 'x64'
      ? 'amd64'
      : (() => {
          throw new Error(`Unsupported architecture: ${arch()}`);
        })();

export const dockerVolumePath = '/tmp/fcu';

// Exceptionnellement, un mkdirSync pour créer le répertoire temporaire
// et éviter les problèmes de droit si root doit le créer
mkdirSync(dockerVolumePath, { recursive: true });

/**
 * Exécute une commande dans un conteneur Docker
 *
 * @param image - Image Docker à utiliser
 * @param command - Commande à exécuter dans le conteneur
 * @param options - Options d'exécution
 * @returns Une promesse qui se résout avec le résultat de la commande si captureOutput est true, sinon void
 */
export function runDocker(image: string, command: string, options: RunCommandOptions = {}): Promise<CommandResult> {
  return runBash(
    `docker run -t --rm --network host -v ${dockerVolumePath}:/volume -w /volume --user $(id -u):$(id -g) ${image} ${command}`,
    options
  );
}

/**
 * Déplace un fichier d'un chemin source vers une destination.
 * Si les fichiers sont sur des systèmes de fichiers différents,
 * copie d'abord le fichier puis supprime la source.
 *
 * @param src - Le chemin du fichier source
 * @param dest - Le chemin de destination
 */
export async function moveFile(src: string, dest: string) {
  await copyFile(src, dest);
  await unlink(src);
}

/**
 * Supprime un fichier s'il existe
 *
 * @param src - Le chemin du fichier à supprimer
 */
export async function unlinkFileIfExists(src: string) {
  if (existsSync(src)) await unlink(src);
}

export async function listDirectoryEntries(basePath: string, type: 'dir' | 'file'): Promise<string[]> {
  const entries = await readdir(basePath);
  const subEntries: string[] = [];

  await Promise.all(
    entries.map(async (name) => {
      const fileStats = await stat(join(basePath, name));
      if ((type === 'dir' && fileStats.isDirectory()) || (type === 'file' && fileStats.isFile())) {
        subEntries.push(name);
      }
    })
  );
  return subEntries;
}

/**
 * Écrit un fichier JSON volumineux en streaming pour éviter les problèmes de mémoire
 * Utile pour les gros GeoJSON qui dépassent la limite de taille de string de Node.js
 *
 * @param filePath - Chemin du fichier à écrire
 * @param data - Objet à sérialiser en JSON (doit avoir une propriété itérable)
 * @param options - Options d'écriture
 * @returns Statistiques sur le fichier écrit (taille en MB)
 */
export async function writeLargeFile(
  filePath: string,
  data: { type: string; features: any[] },
  options: { itemsKey?: string } = {}
): Promise<{ sizeMB: string }> {
  const { itemsKey = 'features' } = options;

  await new Promise<void>((resolve, reject) => {
    const { createWriteStream } = require('node:fs');
    const stream = createWriteStream(filePath);

    stream.on('error', reject);
    stream.on('finish', resolve);

    // Construire l'objet sans la clé des items
    const { [itemsKey]: items, ...rest } = data as any;

    // Écrire l'ouverture de l'objet JSON avec toutes les propriétés sauf les items
    const opening = JSON.stringify(rest).slice(0, -1); // Enlever la dernière accolade
    stream.write(`${opening},"${itemsKey}":[`);

    // Écrire chaque item un par un
    items.forEach((item: any, index: number) => {
      if (index > 0) {
        stream.write(',');
      }
      stream.write(JSON.stringify(item));
    });

    // Fermer le JSON
    stream.write(']}');
    stream.end();
  });

  // Retourner les stats du fichier
  const fileStats = await stat(filePath);
  const sizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

  return { sizeMB };
}
