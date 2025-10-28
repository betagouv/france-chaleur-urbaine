import nodemailer from 'nodemailer';

import { serverConfig } from '@/server/config';
import { logger } from '@/server/helpers/logger';

import { type EmailType, renderEmail } from './react-email';

type EmailUser = { id?: string; email: string };

type EmailParams = Parameters<typeof mailTransport.sendMail>[0];

export const mailTransport = nodemailer.createTransport({
  auth: {
    pass: serverConfig.MAIL_PASS,
    user: serverConfig.MAIL_USER,
  },
  host: serverConfig.MAIL_HOST,
  port: serverConfig.MAIL_PORT,
  secure: false, // upgrade later with STARTTLS
});

export async function sendEmailTemplate<Type extends EmailType>(
  type: Type,
  recipient: EmailUser,
  templateProps: Parameters<typeof renderEmail<Type>>[1] = {} as any,
  { subject, from, replyTo, cc }: Omit<EmailParams, 'html' | 'text' | 'to'> = {}
) {
  const { subject: defaultSubject, html, text } = await renderEmail(type, templateProps);

  const info = await mailTransport.sendMail({
    cc: cc,
    from: from || serverConfig.MAIL_FROM,
    html,
    replyTo: replyTo || serverConfig.MAIL_REPLYTO,
    subject: subject ?? defaultSubject,
    text,
    to: recipient.email,
  });

  logger.info(`send email ${type}`, {
    messageId: info.messageId,
    recipient: recipient.id,
    type,
  });
}
