import bcrypt from 'bcryptjs';

import { type ApiNetwork } from '@/pages/api/v1/users/[key]';
import db from '@/server/db';
import base from '@/server/db/airtable';
import { sendInscriptionEmail } from '@/server/email';
import { type ApiAccount } from '@/types/ApiAccount';
import { Airtable } from '@/types/enum/Airtable';
import { USER_ROLE } from '@/types/enum/UserRole';

export const upsertUsersFromGestionnaireSheet = async () => {
  const newEmails: string[] = [];
  const demands = await base(Airtable.UTILISATEURS).select().all();
  const managers = demands
    .flatMap((demand) => demand.get('Gestionnaires') as string[])
    .filter((manager, index, values) => manager && values.findIndex((x) => x === manager) === index);

  const airtableGestionnaires = await base(Airtable.GESTIONNAIRES).select().all();
  const airtableApiGestionnaires = await base(Airtable.GESTIONNAIRES_API).select().all();

  const users = await db('users').select('email').where('role', USER_ROLE.GESTIONNAIRE);
  const existingEmails = new Set(users.map((user) => user.email));
  const salt = await bcrypt.genSalt(10);

  let existingGestionnaires: string[] = [];
  const emails = ['demo'];

  for (let i = 0; i < airtableGestionnaires.length; i++) {
    const airtableGestionnaire = airtableGestionnaires[i];
    const rawGestionnaires = airtableGestionnaire.get('Gestionnaires') as string[];
    if (!rawGestionnaires || rawGestionnaires.length === 0) {
      continue;
    }
    const gestionnaires = rawGestionnaires.map((gestionnaire) => gestionnaire.trim());
    existingGestionnaires = existingGestionnaires.concat(gestionnaires);
    let email = airtableGestionnaire.get('Email') as string;

    if (email) {
      email = email.toLowerCase().trim();
      emails.push(email);
      const newDemands = airtableGestionnaire.get('Nouvelle demande') === true;
      const oldDemands = airtableGestionnaire.get('Relance') === true;

      if (!existingEmails.has(email)) {
        console.log(`Create account for ${email} on ${gestionnaires.join(', ')}.`);
        newEmails.push(email);
        existingEmails.add(email);
        await db('users').insert({
          email,
          password: bcrypt.hashSync(Math.random().toString(36).slice(2, 10), salt),
          gestionnaires,
          receive_new_demands: newDemands,
          receive_old_demands: oldDemands,
        });
      } else {
        await db('users').where({ email }).update({
          receive_new_demands: newDemands,
          receive_old_demands: oldDemands,
          gestionnaires,
          active: true,
        });

        const airtableApiGestionnaire = airtableApiGestionnaires.find(
          (userAPI) => (userAPI.get('Email') as string)?.toLowerCase().trim() === email
        );

        if (airtableApiGestionnaire) {
          const newFCUTags = gestionnaires;
          const tagsReseaux = airtableApiGestionnaire.get('Réseaux') as string[];

          if (tagsReseaux) {
            tagsReseaux.forEach((gestionnaire) => {
              const tag = gestionnaire.trim();
              const index = newFCUTags.findIndex((t) => t === tag);
              if (index !== -1) {
                newFCUTags.splice(index, 1);
              }
            });

            await base(Airtable.GESTIONNAIRES_API).update(
              airtableApiGestionnaire.id,
              {
                'Tags FCU': newFCUTags,
              },
              { typecast: true }
            );
          }
        }
      }
    }
  }

  // TODO remove, should not be used anymore
  for (let i = 0; i < existingGestionnaires.length; i++) {
    const gestionnaire = existingGestionnaires[i];
    const gestionnaireFakeMail = `${gestionnaire} - FCU`.toLowerCase();
    emails.push(gestionnaireFakeMail);
    if (!existingEmails.has(gestionnaireFakeMail)) {
      console.log(`Create account for ${gestionnaire} - FCU on ${gestionnaire}.`);
      existingEmails.add(gestionnaireFakeMail);
      await db('users').insert({
        email: gestionnaireFakeMail,
        password: bcrypt.hashSync(`${gestionnaire} ${process.env.ACCES_PASSWORD}`, salt),
        gestionnaires: [gestionnaire],
        receive_new_demands: false,
        receive_old_demands: false,
      });
    }
  }

  const toDeactivate = Array.from(existingEmails).filter((email) => !emails.includes(email));

  if (toDeactivate.length > 0) {
    //Keep the user but deactivate it
    const result = await db('users').update('active', false).whereIn('email', toDeactivate).whereNull('from_api');
    console.log(`${result} email(s) deactivated`);
  } else {
    console.log('Nothing to deactivate');
  }

  if (newEmails.length > 0) {
    console.log('Sending mails');
    await Promise.all(newEmails.map((email) => sendInscriptionEmail(email)));
  }

  await Promise.all(
    managers
      .filter((manager) => !existingGestionnaires.includes(manager))
      .map((manager) =>
        base(Airtable.GESTIONNAIRES).create(
          [
            {
              fields: {
                Gestionnaires: [manager],
              },
            },
          ],
          { typecast: true }
        )
      )
  );
};

export const upsertUsersFromApi = async (account: ApiAccount, networks: ApiNetwork[]) => {
  //Users from tab "GESTIONNAIRES_API" where the new users from outside API are saved
  const airtableApiGestionnaires = await base(Airtable.GESTIONNAIRES_API).select().all();
  //Users from tab "GESTIONNAIRES" - all the users of the website
  const airtableGestionnaires = await base(Airtable.GESTIONNAIRES).select().all();

  const warnings: string[] = [];
  const emails = networks.flatMap((user) => user.contacts);
  //On ne désactive pas les comptes supprimés -- vérification manuelle
  /*await db('users')
    .update('active', false)
    .whereNotIn('email', emails)
    .andWhere('from_api', account.key);*/

  const existingUsers = await db('users').select('email').where('from_api', account.key);

  //On ne supprime pas dans le Airtable les users non ré-importés mais on met Réseaux vides
  await Promise.all(
    airtableApiGestionnaires
      .filter((airtableApiGestionnaire) => !emails.includes(airtableApiGestionnaire.get('Email') as string))
      .map((airtableApiGestionnaire) =>
        base(Airtable.GESTIONNAIRES_API).update(airtableApiGestionnaire.id, {
          Réseaux: [],
        })
      )
  );

  //Check les droits pour ajouter un gestionnaire sur le réseau
  const users: Record<string, string[]> = {};
  networks.forEach((network) => {
    if (!account.networks.includes(network.id_sncu)) {
      warnings.push(`Account ${account.key} cannot add user for network ${network.id_sncu}`);
    } else {
      network.contacts.forEach((user) => {
        const contacts = users[user] || [];
        contacts.push(network.id_sncu);
        users[user] = contacts;
      });
    }
  });

  const otherUsers = (await db('users').select('email').whereNull('from_api').whereIn('email', emails)).map((result) => result.email);

  //Don't send this warning message for now
  // if (otherUsers.length > 0) {
  //   warnings.push(
  //     `Some emails are already managed by FCU, please contact us: ${otherUsers.join(
  //       ', '
  //     )}`
  //   );
  // }
  warnings.forEach((warning) => console.log(warning));

  const salt = await bcrypt.genSalt(10);

  await Promise.all(
    Object.keys(users)
      .filter((user) => user && !otherUsers.includes(user))
      .flatMap((user) => {
        //Tag gestionnaire for the "new" user - future column "Réseaux"
        const userGestionnaireTags = users[user].map((network) => `${account.name}_${network}`);
        const airtableApiGestionnaire = airtableApiGestionnaires.find(
          (airtableApiGestionnaire) => airtableApiGestionnaire.get('Email') === user
        );
        const airtableGestionnaire = airtableGestionnaires.find((airtableGestionnaire) => airtableGestionnaire.get('Email') === user);
        //Tags FCU
        const fcuTags = airtableApiGestionnaire ? (airtableApiGestionnaire.get('Tags FCU') as string[]) : [];
        //Concat tags from API (future column "Réseaux") and column "Tags FCU" if existed
        const allGestionnaires =
          airtableApiGestionnaire && fcuTags && fcuTags.length > 0 ? userGestionnaireTags.concat(fcuTags) : userGestionnaireTags;

        const gestionnaireApiData = {
          Email: user,
          Réseaux: userGestionnaireTags,
          Nom: account.name,
        };

        const gestionnaireData = {
          Email: user,
          Gestionnaires: allGestionnaires,
        };

        const promises: Promise<any>[] = [
          db('users')
            .insert({
              email: user,
              password: bcrypt.hashSync(Math.random().toString(36).slice(2, 10), salt),
              gestionnaires: allGestionnaires,
              from_api: account.key,
              receive_new_demands: true,
              receive_old_demands: true,
            })
            .onConflict('email')
            .merge({ gestionnaires: allGestionnaires, active: true }),

          //Maj Airtable avec les nouveaux tags Réseaux (ou ajoute le nouveau compte)
          airtableApiGestionnaire
            ? base(Airtable.GESTIONNAIRES_API).update(airtableApiGestionnaire.id, gestionnaireApiData, { typecast: true })
            : base(Airtable.GESTIONNAIRES_API).create([{ fields: gestionnaireApiData }], { typecast: true }),

          airtableGestionnaire
            ? base(Airtable.GESTIONNAIRES).update(airtableGestionnaire.id, gestionnaireData, { typecast: true })
            : base(Airtable.GESTIONNAIRES).create([{ fields: gestionnaireData }], { typecast: true }),
        ];

        if (!existingUsers.some((existingUser) => existingUser.email === user)) {
          promises.push(sendInscriptionEmail(user));
        }

        return promises;
      })
  );
  return warnings;
};
