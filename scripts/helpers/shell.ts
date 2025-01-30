import { spawn } from 'node:child_process';

import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('shell');

/**
 * Executes a command with the provided arguments and streams its output to the terminal.
 *
 * @param executablePath - path to the executable to run.
 * @param args - An array of arguments to pass to the shell script.
 * @returns A promise that resolves if the command executes successfully, or rejects if the program exits with a non-zero code.
 */
export function runCommand(executablePath: string, ...args: any[]): Promise<void> {
  logger.info(`Running command: ${executablePath} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const process = spawn(executablePath, args, { stdio: 'inherit' });
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
  return runCommand('bash', '-c', ...args);
}

export const dockerVolumePath = '/tmp/fcu';

export function runDocker(image: string, command: string): Promise<void> {
  const cmd = `docker run -it --rm --network host -v ${dockerVolumePath}:/volume -w /volume --user $(id -u):$(id -g) ${image} ${command}`;
  return runBash(cmd);
}
