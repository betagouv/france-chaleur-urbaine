import bcrypt from 'bcryptjs';
import { Airtable } from 'src/types/enum/Airtable';
import { USER_ROLE } from 'src/types/enum/UserRole';
import db from '../db';
import base from '../db/airtable';
import { sendInscriptionEmail } from './email';

export const updateUsers = async () => {
  const newEmails: string[] = [];
  const demands = await base(Airtable.UTILISATEURS).select().all();
  const managers = demands
    .flatMap((demand) => demand.get('Gestionnaires') as string[])
    .filter(
      (manager, index, values) =>
        manager && values.findIndex((x) => x === manager) === index
    );

  const airtableUsers = await base('FCU - Gestionnaires').select().all();

  const users = await db('users')
    .select('email')
    .where('role', USER_ROLE.GESTIONNAIRE);
  const existingEmails = new Set(users.map((user) => user.email));
  const salt = await bcrypt.genSalt(10);

  let existingManager: string[] = [];
  const emails = ['demo'];
  for (let i = 0; i < airtableUsers.length; i++) {
    const user = airtableUsers[i];
    const gestionnaires = user.get('Gestionnaires') as string[];
    if (!gestionnaires || gestionnaires.length === 0) {
      continue;
    }
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
