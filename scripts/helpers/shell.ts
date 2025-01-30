import { spawn } from 'node:child_process';

import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('shell');

/**
 * Executes a shell script with the provided arguments and streams its output to the terminal.
 *
 * @param scriptPath - The path to the shell script to execute.
 * @param args - An array of arguments to pass to the shell script.
 * @returns A promise that resolves when the script completes successfully or rejects with an error if it fails.
 *
 * @throws {Error} If the script fails to execute or exits with a non-zero code.
 */
export function runCommand(scriptPath: string, args: any[] = []): Promise<void> {
  logger.info(`Running command: ${scriptPath} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const process = spawn(scriptPath, args, { stdio: 'inherit' });
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

export function runBash(...args: any[]): Promise<void> {
  return runCommand('bash', ['-c', ...args]);
}

export const dockerVolumePath = '/tmp/fcu';
export function runDocker(image: string, command: string): Promise<void> {
  const cmd = `docker run -it --rm --network host -v ${dockerVolumePath}:/volume -w /volume --user $(id -u):$(id -g) ${image} ${command}`;
  return runBash(cmd);
}
