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

export type CommandResult = {
  output: string;
  exitCode: number;
};

/**
 * Exécute une commande avec les arguments fournis.
 *
 * @param executablePath - Chemin vers l'exécutable à lancer
 * @param args - Arguments à passer à la commande
 * @param options - Options d'exécution
 * @returns Une promesse qui se résout avec le résultat de la commande si captureOutput est true, sinon void
 */
export async function runCommand(
  executablePath: string,
  args: string[] = [],
  options: RunCommandOptions = {}
): Promise<CommandResult | void> {
  const { captureOutput = false, cwd } = options;

  logger.info(`Running command: ${executablePath} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const stdio = captureOutput ? 'pipe' : 'inherit';
    const process = spawn(executablePath, args, { stdio, cwd });

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
          exitCode: code ?? 0,
        });
      } else {
        if (code === 0) {
          resolve();
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

/**
 * Teste l'existence d'une commande système en exécutant `command --version`
 * @param command - Le nom de la commande à tester
 * @returns Un objet avec le statut de la commande et la sortie complète
 */
export async function testCommandExists(command: string): Promise<{ exists: boolean; output: string }> {
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

/**
 * Exécute une commande bash
 *
 * @param command - Commande bash à exécuter
 * @param options - Options d'exécution
 * @returns Une promesse qui se résout avec le résultat de la commande si captureOutput est true, sinon void
 */
export function runBash(command: string, options: RunCommandOptions = {}): Promise<CommandResult | void> {
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
export function runDocker(image: string, command: string, options: RunCommandOptions = {}): Promise<CommandResult | void> {
  return runBash(
    `docker run -it --rm --network host -v ${dockerVolumePath}:/volume -w /volume --user $(id -u):$(id -g) ${image} ${command}`,
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
