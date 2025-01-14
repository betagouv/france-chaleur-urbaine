import bcrypt from 'bcryptjs';

import db from '@/server/db';
import base from '@/server/db/airtable';
import { sendInscriptionEmail } from '@/server/email';
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
