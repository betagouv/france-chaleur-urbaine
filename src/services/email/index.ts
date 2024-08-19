import dotenv from 'dotenv';
import ejs from 'ejs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore: type not official
import nodemailer from 'nodemailer';

import { Demand } from 'src/types/Summary/Demand';

dotenv.config({ path: '.env.local' });
dotenv.config();

type Attachment = {
  filename: string;
  content: string;
  contentType: string;
  encoding: string;
};

const mailTransport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
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
  ccEmail?: string[],
  bccEmail = [],
  attachments: Attachment[] = [],
  replyTo?: string
): Promise<void> => {
  const mail = {
    to: toEmail.join(','),
    cc: ccEmail && ccEmail.join(','),
    bcc: bccEmail.join(','),
    from: process.env.SENDING_EMAIL,
    replyTo: replyTo || process.env.REPLYTO_EMAIL,
    subject,
    html,
    attachments,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error: any, info: any) => (error ? reject(error) : resolve(info)));
  });
};

export const sendNewDemands = async (email: string, demands: number): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/new-demands.ejs', {
    demands,
    link: `${process.env.NEXTAUTH_URL}/connexion`,
  });

  return send([email], '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire', html);
};

export const sendOldDemands = async (email: string): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/old-demands.ejs', {
    link: `${process.env.NEXTAUTH_URL}/connexion`,
  });

  return send([email], '[France Chaleur Urbaine] Vous avez des demandes en attente de prise en charge', html);
};

export const sendInscriptionEmail = async (email: string): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/inscription.ejs', {
    link: process.env.NEXTAUTH_URL,
  });

  return send([email], '[France Chaleur Urbaine] Ouverture de votre espace gestionnaire', html);
};

export const sendResetPasswordEmail = async (email: string, token: string): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/password.ejs', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
  });

  return send([email], 'Réinitialisation de votre mot de passe FCU', html);
};

export const sendBulkEligibilityResult = async (id: string, email: string, attachment: Attachment): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/bulk-eligibility.ejs', {
    link: `${process.env.NEXTAUTH_URL}/carte?id=${id}`,
  });

  return send([email], '[France Chaleur Urbaine] Résultat de votre test', html, [], [], [attachment]);
};

export const sendBulkEligibilityErrorAdmin = async (emails: string | undefined, user: string, attachment: Attachment): Promise<void> => {
  if (!emails) {
    return;
  }

  const html = await ejs.renderFile('./src/services/email/views/bulk-eligibility-error-admin.ejs', {
    user,
  });

  return send(emails.split(','), "[France Chaleur Urbaine] Erreur lors d'un test", html, [], [], [attachment]);
};

export const sendBulkEligibilityError = async (email: string): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/bulk-eligibility-error.ejs');

  return send([email], '[France Chaleur Urbaine] Erreur lors de votre test', html);
};

export const sendRelanceMail = async (demand: Demand, id: string): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/relance.ejs', {
    firstName: demand.Prénom,
    date: new Date(demand['Date demandes']).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    link: `${process.env.NEXTAUTH_URL}/satisfaction?id=${id}&satisfaction=`,
    calendarLink:
      demand.Structure === 'Copropriété' || demand.Structure === 'Maison individuelle'
        ? 'https://calendly.com/erwan-gravez-beta/30min'
        : 'https://app.calendso.incubateur.net/camillefwok/15min',
  });

  return send([demand.Mail], 'Votre demande sur France Chaleur Urbaine', html);
};

export const sendManagerEmail = async (
  subject: string,
  recipient: string,
  body: string,
  signature: string,
  cc: string[],
  replyTo: string
): Promise<void> => {
  const html = await ejs.renderFile('./src/services/email/views/manager-email.ejs', {
    content: body,
    signature: signature,
  });

  return send([recipient], subject, html, cc, [], [], replyTo);
};
