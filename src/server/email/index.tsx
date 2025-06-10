import nodemailer from 'nodemailer';

import { logger } from '@/server/helpers/logger';
import { type User } from '@/types/User';

import { type EmailType, renderEmail } from './react-email';

type EmailUser = Pick<User, 'id' | 'email'>;

type EmailParams = Parameters<typeof mailTransport.sendMail>[0];

export const mailTransport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
} as any); // TODO trouver le bon typage

export const sendEmail = async ({ from, replyTo, to, subject, html, text }: Parameters<typeof mailTransport.sendMail>[0]) =>
  mailTransport.sendMail({
    to,
    from: from || process.env.SENDING_EMAIL,
    replyTo: replyTo || process.env.REPLYTO_EMAIL,
    subject,
    html,
    text,
  });

export async function sendEmailTemplate<Type extends EmailType>(
  type: Type,
  recipient: EmailUser,
  templateProps: Parameters<typeof renderEmail<Type>>[1] = {} as any,
  { subject, ...emailParams }: Omit<EmailParams, 'html' | 'text' | 'to'> = {}
) {
  const { subject: defaultSubject, html, text } = await renderEmail(type, templateProps);

  const info = await sendEmail({
    to: recipient.email,
    subject: subject || defaultSubject,
    html,
    text,
    ...emailParams,
  });

  logger.info(`send email ${type}`, {
    type: type,
    recipient: recipient.id,
    messageId: info.messageId,
  });
}
