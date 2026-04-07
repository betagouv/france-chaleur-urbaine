import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { Command } from '@commander-js/extra-typings';
import Papa from 'papaparse';

import { runTilesGeneration } from '@/modules/tiles/server/generation-run';
import { kdb } from '@/server/db/kysely';

type EcoreseauCsvRow = {
  collectivite: string;
  reseau: string;
  identifiant: string;
};

async function loadEcoreseauIds(filepath: string): Promise<string[]> {
  const fileContent = await readFile(filepath, 'utf8');
  const parsed = Papa.parse<EcoreseauCsvRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Erreur de parsing dans ${filepath}: ${parsed.errors[0]?.message ?? 'erreur inconnue'}`);
  }

  return parsed.data.map((row) => row.identifiant?.trim()).filter((identifiant): identifiant is string => !!identifiant);
}

export function registerEcoreseauCommand(parentProgram: Command) {
  parentProgram
    .command('import:ecoreseau')
    .description('Importe les labels Ecoréseau depuis les CSV et met à jour reseaux_de_chaleur.ecoreseau via l’ID SNCU')
    .action(async () => {
      const ecoreseauIds = await loadEcoreseauIds(resolve(process.cwd(), 'src/data/ecoreseau/Laureats_Label_Ecoreseau_2025.csv'));
      const ecoreseauPlusIds = await loadEcoreseauIds(resolve(process.cwd(), 'src/data/ecoreseau/Laureats_Label_Ecoreseau_+_2025.csv'));

      await kdb.transaction().execute(async (tx) => {
        if (ecoreseauIds.length > 0) {
          await tx
            .updateTable('reseaux_de_chaleur')
            .set({ ecoreseau: 'ecoreseau 2025' })
            .where('Identifiant reseau', 'in', ecoreseauIds)
            .execute();
        }

        if (ecoreseauPlusIds.length > 0) {
          await tx
            .updateTable('reseaux_de_chaleur')
            .set({ ecoreseau: 'ecoreseau + 2025' })
            .where('Identifiant reseau', 'in', ecoreseauPlusIds)
            .execute();
        }
      });

      await runTilesGeneration('reseaux-de-chaleur');

      console.info('Import Ecoréseau terminé');
    });
}
