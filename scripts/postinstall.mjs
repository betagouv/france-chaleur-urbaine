import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// ce script supprime les fichiers non compatibles avec le système d'exploitation pour diminuer la taille de node_modules
// pour les modules sharp, rollup, swc

const arch = process.arch; // 'x64', 'arm64', ...
const platform = process.platform; // 'linux', 'darwin', 'win32', ...
const { glibcVersionRuntime } = process.report.getReport().header;

console.info(`Nettoyage des binaires natifs pour ${platform}-${arch}`);

// Fonction pour nettoyer un répertoire de binaires natifs
function cleanNativeBinaries(baseDir, packagePrefix) {
  if (!existsSync(baseDir)) {
    console.info(`Répertoire ${baseDir} non trouvé, ignoré.`);
    return;
  }

  try {
    let removed = 0;
    for (const name of readdirSync(baseDir)) {
      if (name.startsWith(packagePrefix)) {
        // Vérifie si le package correspond à l'architecture/plateforme actuelle
        const isCurrentPlatform = name.includes(platform);
        const isCurrentArch = name.includes(arch);
        const shouldBeRemoved = glibcVersionRuntime ? name.includes('musl') : name.includes('gnu') && !name.includes('musl');

        if (!isCurrentPlatform || !isCurrentArch || shouldBeRemoved) {
          const fullPath = join(baseDir, name);
          console.info(`=> [supprimé] ${name}`);
          rmSync(fullPath, { force: true, recursive: true });
          removed++;
        } else {
          console.info(`=> [conservé] ${name}`);
        }
      }
    }
    console.info(`${removed} package(s) ${packagePrefix} supprimé(s) de ${baseDir}`);
  } catch (error) {
    console.warn(`Erreur lors du nettoyage de ${baseDir}:`, error.message);
  }
}

const packagesToClean = ['@img+sharp-', '@rollup+rollup-', '@next+swc-', '@biomejs/cli-'];

packagesToClean.forEach((packagePrefix) => {
  cleanNativeBinaries(join('node_modules', '.pnpm'), packagePrefix);
});
