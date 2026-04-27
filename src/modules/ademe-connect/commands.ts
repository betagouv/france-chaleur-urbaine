import type { Command } from '@commander-js/extra-typings';
import dayjs from 'dayjs';
import { z } from 'zod';

import { buildRubriques, ROLE_TYPE_ORGANISME } from '@/modules/ademe-connect/constants';
import { createContact, getContact } from '@/modules/ademe-connect/server/client';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { isOneOf } from '@/utils/array';

export function registerAdemeConnectCommands(parentProgram: Command) {
  const program = parentProgram.command('ademe-connect').description('Commandes pour le CRM ADEME Connect');

  program
    .command('contact:get')
    .description("Récupère les informations d'un contact depuis l'API ADEME Connect")
    .argument('<email>', 'Email du contact', (v) => z.email().parse(v))
    .action(async (email) => {
      const contact = await getContact(email);
      logger.info(JSON.stringify(contact, null, 2));
    });

  program
    .command('contact:create')
    .description("Crée un contact dans l'API ADEME Connect")
    .argument('<email>', 'Email du contact', (v) => z.email().parse(v))
    .option('--nom <nom>', 'Nom du contact')
    .option('--prenom <prenom>', 'Prénom du contact')
    .option('--telephone <telephone>', 'Téléphone du contact')
    .option('--type-organisme <typeOrganisme>', 'Type organisme (Particulier, Entreprise, Collectivité…)')
    .action(async (email, options) => {
      const result = await createContact({
        email,
        nom: options.nom,
        prenom: options.prenom,
        telephone: options.telephone,
        typeOrganisme: options.typeOrganisme,
      });
      logger.info(JSON.stringify(result, null, 2));
    });

  program
    .command('contacts:bulk-create')
    .description("Crée en masse tous les utilisateurs FCU dans ADEME Connect (reprise de l'existant)")
    .option('--dry-run', "Affiche les contacts qui seraient créés sans appeler l'API", false)
    .action(async ({ dryRun }) => {
      const users = await kdb
        .selectFrom('users')
        .select(['email', 'first_name', 'last_name', 'phone', 'role', 'structure_type', 'optin_at', 'created_at', 'last_connection'])
        .where('role', 'in', ['particulier', 'professionnel', 'gestionnaire'])
        .where('status', '=', 'valid')
        .orderBy('created_at', 'asc')
        .execute();

      logger.info(`${users.length} utilisateurs à synchroniser${dryRun ? ' (dry-run)' : ''}`);

      let success = 0;
      let errors = 0;

      for (const user of users) {
        if (dryRun) {
          logger.info(`[dry-run] ${user.email} (${user.role})`);
          continue;
        }

        try {
          await createContact({
            abonnementNewsletter: !!user.optin_at,
            acceptationRGPD: isOneOf(user.role, ['particulier', 'professionnel']),
            dateConnexion: user.last_connection ? dayjs(user.last_connection).format('YYYY-MM-DDTHH:mm:ss') : undefined,
            dateCreation: user.created_at ? dayjs(user.created_at).format('YYYY-MM-DDTHH:mm:ss') : undefined,
            dateNewsletter: user.optin_at ? dayjs(user.optin_at).format('YYYY-MM-DD') : undefined,
            email: user.email,
            nom: user.last_name ?? undefined,
            prenom: user.first_name ?? undefined,
            rubriques: buildRubriques(user.role, user.structure_type),
            telephone: user.phone ?? undefined,
            typeOrganisme: ROLE_TYPE_ORGANISME[user.role],
          });
          logger.info(`✓ ${user.email}`);
          success++;
        } catch (error) {
          logger.error(`✗ ${user.email}`, { error });
          errors++;
        }
      }

      if (!dryRun) {
        logger.info(`Terminé : ${success} créés, ${errors} erreurs`);
      }
    });
}
