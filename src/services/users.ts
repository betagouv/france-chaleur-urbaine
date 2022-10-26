import bcrypt from 'bcryptjs';
import db from '../db';
import base from '../db/airtable';

export const updateUsers = async () => {
  const gestionnaires = await base('FCU - Tags gestionnaires').select().all();
  const users = await db('users').select('email');
  const existingEmails = new Set(users.map((user) => user.email));
  const salt = await bcrypt.genSalt(10);

  const emails = ['demo', 'paris'];
  for (let i = 0; i < gestionnaires.length; i++) {
    const gestionnaire = gestionnaires[i];
    const tag = gestionnaire.get('Nom tag');
    if (!tag) {
      continue;
    }
    emails.push(`${tag} - FCU`.toLowerCase());
    if (!existingEmails.has(`${tag} - FCU`.toLowerCase())) {
      console.log(`Create account for ${tag} - FCU on ${tag}.`);
      await db('users').insert({
        email: `${tag} - FCU`.toLowerCase(),
        password: bcrypt.hashSync(`${tag} ${process.env.ACCES_PASSWORD}`, salt),
        gestionnaire: tag,
      });
    }
    for (let j = 1; j < 10; j++) {
      let email = gestionnaire.get(`Email ${j}`) as string;
      if (email) {
        email = email.toLowerCase();
        emails.push(email);
        if (!existingEmails.has(email)) {
          console.log(`Create account for ${email} on ${tag}.`);
          await db('users').insert({
            email,
            password: bcrypt.hashSync(
              Math.random().toString(36).slice(2, 10),
              salt
            ),
            gestionnaire: tag,
          });
        }
      }
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
};
