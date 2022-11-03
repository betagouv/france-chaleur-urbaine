import dotenv from 'dotenv';
import ejs from 'ejs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore: type not official
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env.local' });
dotenv.config();

const mailTransport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  ignoreTLS: process.env.MAIL_REQUIRE_TLS === 'false',
  requireTLS: process.env.MAIL_REQUIRE_TLS === 'true',
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const send = (
  toEmail: string[],
  subject: string,
  html: string,
  ccEmail = [],
  bccEmail = []
): Promise<void> => {
  const mail = {
    to: toEmail.join(','),
    cc: ccEmail.join(','),
    bcc: bccEmail.join(','),
    from: `FCU <${process.env.SENDING_EMAIL}>`,
    replyTo: process.env.SENDING_EMAIL,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error: any, info: any) =>
      error ? reject(error) : resolve(info)
    );
  });
};

export const sendNewDemands = async (
  email: string,
  demands: number
): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/demands.ejs', {
    demands,
    link: `${process.env.NEXTAUTH_URL}/connexion`,
    email,
  });

  return send(
    ['floclemy@gmail.com'],
    '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire',
    html
  );
};

export const sendInscriptionEmail = async (email: string): Promise<void> => {
  const html = await ejs.renderFile(
    './src/services/email/views/inscription.ejs',
    {
      link: process.env.NEXTAUTH_URL,
      email,
    }
  );

  return send(
    ['floclemy@gmail.com'],
    '[France Chaleur Urbaine] Ouverture de votre espace gestionnaire',
    html
  );
};

export const sendResetPasswordEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/password.ejs', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
  });

  return send([email], 'Réinitialisation de votre mot de passe FCU.', html);
};
