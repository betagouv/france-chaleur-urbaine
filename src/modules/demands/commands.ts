import type { Command } from '@commander-js/extra-typings';

import { logger } from '@/server/helpers/logger';

import { dedupeDemands } from './server/dedupe';

/** Enregistre les commandes CLI du module demands. */
export function registerDemandsCommands(parentProgram: Command) {
  const demandsCommand = parentProgram.command('demands').description('Commandes pour la gestion des demandes de raccordement');

  demandsCommand
    .command('dedupe')
    .description('Dédoublonne les demandes (même email + adresse). Dry-run par défaut (écrit un CSV) ; --apply pour soft-delete en base.')
    .option('--apply', 'Applique les suppressions en base (soft-delete). Sans ce flag : dry-run, aucune écriture en base.', false)
    .option('--out <file>', 'Chemin du rapport CSV', 'demands-dedupe.csv')
    .action(async (options: { apply: boolean; out: string }) => {
      const plan = await dedupeDemands({ apply: options.apply, out: options.out });
      logger.info(
        `demands:dedupe terminé — ${plan.duplicateGroups} groupes, ${plan.deletions.length} suppressions ${options.apply ? 'appliquées' : 'prévues (dry-run)'}`
      );
    });
}
