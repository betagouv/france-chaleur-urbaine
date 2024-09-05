import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Script from https://doc.scalingo.com/languages/nodejs/nextjs-standalone
// Using the Next standalone mode, we are responsible to handle assets.
// This scripts copies all assets to the dist folder to be served by the Next server.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const staticSrcPath = path.join(dirname, '.next/static');
const staticDestPath = path.join(dirname, '.next/standalone/.next/static');

const publicSrcPath = path.join(dirname, 'public');
const publicDestPath = path.join(dirname, '.next/standalone/public');

function copyAssets(src, dest) {
  return fs
    .mkdir(dest, { recursive: true })
    .then(() => fs.readdir(src, { withFileTypes: true }))
    .then((items) => {
      const promises = items.map((item) => {
        const srcPath = path.join(src, item.name);
        const destPath = path.join(dest, item.name);

        if (item.isDirectory()) {
          return copyAssets(srcPath, destPath);
        } else {
          return fs.copyFile(srcPath, destPath);
        }
      });
      return Promise.all(promises);
    })
    .catch((err) => {
      console.error(`Error: ${err}`);
      throw err;
    });
}

const greenTick = `\x1b[32m\u2713\x1b[0m`;
const redCross = `\x1b[31m\u274C\x1b[0m`;
copyAssets(staticSrcPath, staticDestPath)
  .then(() => copyAssets(publicSrcPath, publicDestPath))
  .then(() => console.log(`${greenTick} Assets copied successfully`))
  .catch((err) => console.error(`${redCross} Failed to copy assets: ${err}`));
