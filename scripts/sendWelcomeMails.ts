import db from '../src/db';
import { sendInscriptionEmail } from '../src/services/email';

const sendWelcomeMails = async () => {
  const users = await db('users').select('email').whereNull('last_connection');
  const emails = users
    .map((user) => user.email)
    .filter((email: string) => !email.endsWith(' - fcu'));

  await Promise.all(emails.map((email) => sendInscriptionEmail(email)));

  console.info(emails.length + ' sent');
  process.exit(0);
};

sendWelcomeMails();
