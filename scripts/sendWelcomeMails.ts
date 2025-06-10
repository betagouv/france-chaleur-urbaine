import db from '@/server/db';
import { sendEmailTemplate } from '@/server/email';

const sendWelcomeMails = async () => {
  const users = await db('users').select('email').whereNull('last_connection');
  const recipients = users.map((user) => ({ id: user.id, email: user.email })).filter(({ email }) => !email.endsWith(' - fcu'));

  await Promise.all(recipients.map((recipient) => sendEmailTemplate('inscription', recipient)));

  console.info(recipients.length + ' sent');
  process.exit(0);
};

sendWelcomeMails();
