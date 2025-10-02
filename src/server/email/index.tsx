import nodemailer from 'nodemailer';

import { logger } from '@/server/helpers/logger';

import { type EmailType, renderEmail } from './react-email';

type EmailUser = { id?: string; email: string };

type EmailParams = Parameters<typeof mailTransport.sendMail>[0];

export const mailTransport = nodemailer.createTransport({
  auth: {
    pass: process.env.MAIL_PASS,
    user: process.env.MAIL_USER,
  },
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true',
} as any); // TODO trouver le bon typage

export const sendEmail = async ({ from, replyTo, to, subject, html, text }: Parameters<typeof mailTransport.sendMail>[0]) =>
  mailTransport.sendMail({
    from: from || process.env.SENDING_EMAIL,
    html,
    replyTo: replyTo || process.env.REPLYTO_EMAIL,
    subject,
    text,
    to,
  });

export async function sendEmailTemplate<Type extends EmailType>(
  type: Type,
  recipient: EmailUser,
  templateProps: Parameters<typeof renderEmail<Type>>[1] = {} as any,
  { subject, ...emailParams }: Omit<EmailParams, 'html' | 'text' | 'to'> = {}
) {
  const { subject: defaultSubject, html, text } = await renderEmail(type, templateProps);

  const info = await sendEmail({
    html,
    subject: subject ?? defaultSubject,
    text,
    to: recipient.email,
    ...emailParams,
  });

  logger.info(`send email ${type}`, {
    messageId: info.messageId,
    recipient: recipient.id,
    type,
  });
}
