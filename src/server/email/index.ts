import dotenv from 'dotenv';
import ejs from 'ejs';
import nodemailer from 'nodemailer';

import { type Demand } from '@/types/Summary/Demand';

dotenv.config({ path: '.env.local' });
dotenv.config();

type Attachment = {
  filename: string;
  content: string;
  contentType: string;
  encoding: string;
};

export const mailTransport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
} as any); // TODO trouver le bon typage

const send = (
  toEmail: string[],
  subject: string,
  html: string,
  ccEmail?: string[],
  bccEmail = [],
  attachments: Attachment[] = [],
  replyTo?: string
): Promise<any> => {
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

  return mailTransport.sendMail(mail);
};

export const sendNewDemands = async (email: string, demands: number): Promise<void> => {
  const html = await ejs.renderFile('./src/server/email/views/new-demands.ejs', {
    demands,
    link: `${process.env.NEXTAUTH_URL}/connexion`,
  });

  return send([email], '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire', html);
};

export const sendOldDemands = async (email: string): Promise<void> => {
  const html = await ejs.renderFile('./src/server/email/views/old-demands.ejs', {
    link: `${process.env.NEXTAUTH_URL}/connexion`,
  });

  return send([email], '[France Chaleur Urbaine] Vous avez des demandes en attente de prise en charge', html);
};

export const sendInscriptionEmail = async (email: string): Promise<void> => {
  const html = await ejs.renderFile('./src/server/email/views/inscription.ejs', {
    link: process.env.NEXTAUTH_URL,
  });

  return send([email], '[France Chaleur Urbaine] Ouverture de votre espace gestionnaire', html);
};

export const sendResetPasswordEmail = async (email: string, token: string): Promise<void> => {
  const html = await ejs.renderFile('./src/server/email/views/password.ejs', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
  });

  return send([email], 'Réinitialisation de votre mot de passe FCU', html);
};

export const sendRelanceMail = async (demand: Demand, id: string): Promise<void> => {
  const html = await ejs.renderFile('./src/server/email/views/relance.ejs', {
    firstName: demand.Prénom,
    date: new Date(demand['Date demandes']).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    adresse: demand.Adresse,
    link: `${process.env.NEXTAUTH_URL}/satisfaction?id=${id}&satisfaction=`,
    calendarLink: 'https://cal.com/erwangravez/15min',
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
  const html = await ejs.renderFile('./src/server/email/views/manager-email.ejs', {
    content: body,
    signature: signature,
  });

  return send([recipient], subject, html, cc, [], [], replyTo);
};
