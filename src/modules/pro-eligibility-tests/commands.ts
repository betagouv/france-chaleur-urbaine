import type { Command } from '@commander-js/extra-typings';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
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
    .option('--batch-size <number>', "Nombre d'adresses à traiter par batch", '100')
    .option('--limit <number>', "Limite le nombre d'adresses à traiter (pour tests)")
    .option('--dry-run', 'Simulation sans modification de la base de données')
    .action(async (options) => {
      const batchSize = parseInt(options.batchSize, 10);
      const limit = options.limit ? parseInt(options.limit, 10) : undefined;
      const dryRun = !!options.dryRun;

      if (dryRun) {
        logger.info('Mode DRY RUN activé - aucune modification ne sera effectuée');
      }

      if (limit) {
        logger.info(`Limite définie: ${limit} adresses maximum`);
      }

      // Récupérer toutes les adresses qui ont des coordonnées et pas d'historique
      let query = kdb
        .selectFrom('pro_eligibility_tests_addresses')
        .select([
          'id',
          'eligibility_history',
          sql<number>`ST_Y(ST_Transform(geom, 4326))`.as('latitude'),
          sql<number>`ST_X(ST_Transform(geom, 4326))`.as('longitude'),
        ])
        .where('geom', 'is not', null)
        .where((eb) => eb('eligibility_history', '=', '[]'));

      if (limit) {
        query = query.limit(limit);
      }

      const addresses = await query.execute();

      if (addresses.length === 0) {
        logger.info('Aucune adresse à traiter');
        return;
      }

      logger.info(`${addresses.length} adresses à traiter (batch size: ${batchSize})`);

      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      let updatedCount = 0;

      // Traiter les adresses par batch
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);

        logger.info(
          `Traitement du batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(addresses.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, addresses.length)}/${addresses.length})`
        );

        await Promise.all(
          batch.map(async (address) => {
            try {
              // Vérifier si l'historique existe déjà
              const existingHistory = address.eligibility_history as ProEligibilityTestHistoryEntry[];
              if (existingHistory && existingHistory.length > 0) {
                skippedCount++;
                processedCount++;
                return;
              }

              if (!dryRun) {
                logger.info(
                  `Calcul de l'éligibilité pour l'adresse ${address.id} latitude: ${address.latitude} longitude: ${address.longitude}`
                );

                // Calculer et mettre à jour l'éligibilité via le service
                await updateAddressEligibilityHistory(address.id, address.latitude as number, address.longitude as number);

                updatedCount++;
              } else {
                updatedCount++;
              }

              processedCount++;
            } catch (error) {
              errorCount++;
              logger.error(`Erreur pour l'adresse ${address.id}:`, error);
              processedCount++;
            }
          })
        );
      }

      // Afficher le résumé
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
