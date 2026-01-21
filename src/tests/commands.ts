import type { Command } from '@commander-js/extra-typings';

import { eligibilityFixtures } from '@/tests/fixtures/eligibility';
import { terminalLink } from '@/utils/cli';

export function registerTestCommands(parentProgram: Command) {
  const program = parentProgram.command('test').description('Commandes pour les tests');

  program
    .command('export-eligibility-fixtures')
    .description("Exporte les données de test d'éligibilité en GeoJSON pour visualisation sur geojson.io")
    .action(() => {
      console.log(
        `URL : ${terminalLink('ctrl + click pour ouvrir geojson.io', `https://geojson.io/#data=data:application/json,${encodeURIComponent(JSON.stringify(eligibilityFixtures))}`)}`
      );
    });
}
