import bcrypt from 'bcryptjs';
import { Airtable } from 'src/types/enum/Airtable';
import { USER_ROLE } from 'src/types/enum/UserRole';
import db from '../db';
import base from '../db/airtable';
import { sendInscriptionEmail } from './email';
import { ApiAccount } from 'src/types/ApiAccount';
import { ApiNetwork } from '@pages/api/v1/users/[key]';

export const upsertUsersFromApi = async (
  account: ApiAccount,
  networks: ApiNetwork[]
) => {
  const airtableUser = await base(Airtable.GESTIONNAIRES_API).select().all();

  const warnings: string[] = [];
  const emails = networks.flatMap((user) => user.contacts);
  await db('users')
    .delete()
    .whereNotIn('email', emails)
    .andWhere('from_api', account.key);

  const existingUsers = await db('users')
    .select('email')
    .where('from_api', account.key);

  await Promise.all(
    airtableUser.map((airtableUser) =>
      base(Airtable.GESTIONNAIRES_API).destroy(airtableUser.getId())
    )
  );
  const users: Record<string, string[]> = {};
  networks.forEach((network) => {
    if (!account.networks.includes(network.id_sncu)) {
      warnings.push(
        `Account ${account.key} cannot add user for network ${network.id_sncu}`
      );
    } else {
      network.contacts.forEach((user) => {
        const contacts = users[user] || [];
        contacts.push(network.id_sncu);
        users[user] = contacts;
      });
    }
  });

  const otherUsers = (
    await db('users')
      .select('email')
      .whereNull('from_api')
      .whereIn('email', emails)
  ).map((result) => result.email);

  if (otherUsers.length > 0) {
    warnings.push(
      `Some emails are already managed by FCU, please contact us: ${otherUsers.join(
        ', '
      )}`
    );
  }
  warnings.forEach((warning) => console.log(warning));
  const salt = await bcrypt.genSalt(10);
  await Promise.all(
    Object.keys(users)
      .filter((user) => !otherUsers.includes(user))
      .flatMap((user) => {
        const gestionnaires = users[user].map(
          (network) => `${account.name}_${network}`
        );
        const promises: Promise<any>[] = [
          db('users')
            .insert({
              email: user,
              password: bcrypt.hashSync(
                Math.random().toString(36).slice(2, 10),
                salt
              ),
              gestionnaires,
              from_api: account.key,
              receive_new_demands: true,
              receive_old_demands: true,
            })
            .onConflict('email')
            .merge({ gestionnaires }),
          base(Airtable.GESTIONNAIRES_API).create(
            [
              {
                fields: {
                  Email: user,
                  Réseaux: gestionnaires,
                  Nom: account.name,
                },
              },
            ],
            {
              typecast: true,
            }
          ),
        ];

        if (
          !existingUsers.some((existingUser) => existingUser.email === user)
        ) {
          promises.push(sendInscriptionEmail(user));
        }

        return promises;
      })
  );
  return warnings;
};

export const updateUsers = async () => {
  const newEmails: string[] = [];
  const demands = await base(Airtable.UTILISATEURS).select().all();
  const managers = demands
    .flatMap((demand) => demand.get('Gestionnaires') as string[])
    .filter(
      (manager, index, values) =>
        manager && values.findIndex((x) => x === manager) === index
    );

  const airtableUsers = await base(Airtable.GESTIONNAIRES).select().all();

  const users = await db('users')
    .select('email')
    .where('role', USER_ROLE.GESTIONNAIRE);
  const existingEmails = new Set(users.map((user) => user.email));
  const salt = await bcrypt.genSalt(10);

  let existingManager: string[] = [];
  const emails = ['demo'];
  for (let i = 0; i < airtableUsers.length; i++) {
    const user = airtableUsers[i];
    const rawGestionnaires = user.get('Gestionnaires') as string[];
    if (!rawGestionnaires || rawGestionnaires.length === 0) {
      continue;
    }
    const gestionnaires = rawGestionnaires.map((gestionnaire) => {
      return gestionnaire.trim();
    });
    existingManager = existingManager.concat(gestionnaires);
    let email = user.get('Email') as string;
    if (email) {
      email = email.toLowerCase().trim();
      emails.push(email);
      const newDemands = user.get('Nouvelle demande') === true;
      const oldDemands = user.get('Relance') === true;
      if (!existingEmails.has(email)) {
        console.log(
          `Create account for ${email} on ${gestionnaires.join(', ')}.`
        );
        newEmails.push(email);
        existingEmails.add(email);
        await db('users').insert({
          email,
          password: bcrypt.hashSync(
            Math.random().toString(36).slice(2, 10),
            salt
          ),
          gestionnaires,
          receive_new_demands: newDemands,
          receive_old_demands: oldDemands,
        });
      } else {
        await db('users').where({ email }).update({
          receive_new_demands: newDemands,
          receive_old_demands: oldDemands,
          gestionnaires,
        });
      }
    }
  }

  for (let i = 0; i < existingManager.length; i++) {
    const gestionnaire = existingManager[i];
    const gestionnaireFakeMail = `${gestionnaire} - FCU`.toLowerCase();
    emails.push(gestionnaireFakeMail);
    if (!existingEmails.has(gestionnaireFakeMail)) {
      console.log(
        `Create account for ${gestionnaire} - FCU on ${gestionnaire}.`
      );
      existingEmails.add(gestionnaireFakeMail);
      await db('users').insert({
        email: gestionnaireFakeMail,
        password: bcrypt.hashSync(
          `${gestionnaire} ${process.env.ACCES_PASSWORD}`,
          salt
        ),
        gestionnaires: [gestionnaire],
        receive_new_demands: false,
        receive_old_demands: false,
      });
    }
  }

  const toDelete = Array.from(existingEmails).filter(
    (email) => !emails.includes(email)
  );

  if (toDelete.length > 0) {
    console.log('Delete emails:', toDelete);
    await db('users').delete().whereIn('email', toDelete);
  } else {
    console.log('Nothing to delete');
  }

  if (newEmails.length > 0) {
    console.log('Sending mails');
    await Promise.all(newEmails.map((email) => sendInscriptionEmail(email)));
  }

  await Promise.all(
    managers
      .filter((manager) => !existingManager.includes(manager))
      .map((manager) =>
        base('FCU - Gestionnaires').create(
          [
            {
              fields: {
                Gestionnaires: [manager],
              },
            },
          ],
          {
            typecast: true,
          }
        )
      )
  );
};
