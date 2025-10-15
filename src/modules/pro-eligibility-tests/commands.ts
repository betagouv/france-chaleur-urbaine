import type { Command } from '@commander-js/extra-typings';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { processInParallel } from '@/utils/async';
import { updateAddressEligibilityHistory } from './server/service';
import type { ProEligibilityTestHistoryEntry } from './types';

/**
 * Enregistre les commandes CLI pour le module pro-eligibility-tests
 */
export function registerProEligibilityTestsCommands(parentProgram: Command) {
  const program = parentProgram.command('pro-eligibility-tests').description("Commandes pour les tests d'éligibilité professionnels");

  program
    .command('calculate-all-eligibilities')
    .description("Calcule et initialise l'historique d'éligibilité pour toutes les adresses")
    .option('--concurrency <number>', "Nombre d'adresses traitées en parallèle", '20')
    .option('--limit <number>', "Limite le nombre d'adresses à traiter (pour tests)")
    .option('--dry-run', 'Simulation sans modification de la base de données')
    .action(async (options) => {
      const concurrency = parseInt(options.concurrency, 10);
      const limit = options.limit ? parseInt(options.limit, 10) : undefined;
      const dryRun = !!options.dryRun;

      if (dryRun) {
        logger.info('Mode DRY RUN activé - aucune modification ne sera effectuée');
      }

      if (limit) {
        logger.info(`Limite définie: ${limit} adresses maximum`);
      }

      const updated = await kdb
        .updateTable('pro_eligibility_tests_addresses')
        .set('eligibility_history', null)
        .where('ban_valid', 'is', false)
        .executeTakeFirstOrThrow();
      logger.info(`${updated.numUpdatedRows} adresses non valides dont eligibility_history est mis à null`);

      // Récupère toutes les adresses qui ont des coordonnées et pas d'historique
      let query = kdb
        .selectFrom('pro_eligibility_tests_addresses')
        .select([
          'id',
          'eligibility_history',
          sql<number>`ST_Y(ST_Transform(geom, 4326))`.as('latitude'),
          sql<number>`ST_X(ST_Transform(geom, 4326))`.as('longitude'),
        ])
        .where('geom', 'is not', null)
        .where('ban_valid', 'is', true)
        .where('eligibility_history', '=', '[]');

      if (limit) {
        query = query.limit(limit);
      }

      const addresses = await query.execute();

      if (addresses.length === 0) {
        logger.info('Aucune adresse à traiter');
        return;
      }

      const totalAddresses = addresses.length;
      logger.info(`${totalAddresses} adresses à traiter (concurrence: ${concurrency})`);

      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      let updatedCount = 0;

      // Traite toutes les adresses en parallèle avec contrôle de concurrence
      await processInParallel(addresses, concurrency, async (address) => {
        try {
          // Vérifie si l'historique existe déjà
          const existingHistory = address.eligibility_history as ProEligibilityTestHistoryEntry[];
          if (existingHistory && existingHistory.length > 0) {
            skippedCount++;
            processedCount++;
            return;
          }

          if (!dryRun) {
            // Calcule et met à jour l'éligibilité via le service
            await updateAddressEligibilityHistory(address.id, address.latitude as number, address.longitude as number);
            updatedCount++;
          } else {
            updatedCount++;
          }

          processedCount++;

          // Affiche la progression tous les 100 éléments
          if (processedCount % 100 === 0) {
            const progress = Math.round((processedCount / totalAddresses) * 100);
            const remaining = totalAddresses - processedCount;
            logger.info('Progression', {
              processed: processedCount,
              progress: `${progress}%`,
              remaining,
              total: totalAddresses,
            });
          }
        } catch (error) {
          errorCount++;
          logger.error(`Erreur pour l'adresse ${address.id}:`, error);
          processedCount++;
        }
      });

      // Affiche le résumé
      logger.info('═══════════════════════════════════════');
      logger.info("Résumé de l'exécution:");
      logger.info(`  Total traité:      ${processedCount}`);
      logger.info(`  Mis à jour:        ${updatedCount}`);
      logger.info(`  Déjà existant:     ${skippedCount}`);
      logger.info(`  Erreurs:           ${errorCount}`);
      logger.info('═══════════════════════════════════════');

      if (dryRun) {
        logger.info('Mode DRY RUN - Aucune modification effectuée');
      }
    });
}
