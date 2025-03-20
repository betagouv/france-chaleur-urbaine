import { render } from '@react-email/components';
import { type ComponentProps } from 'react';

import { type User } from '@/types/User';

import EmailInscription from './EmailInscription';
import { type CommonEmailProps, commonEmailsProps } from './helpers';
import { logger } from '../helpers/logger';

import { mailTransport } from '.';

type EmailDefinition = {
  subject: string;
  component: (...args: any[]) => JSX.Element;
};

const emails = {
  inscription: {
    subject: '[France Chaleur Urbaine] Confirmez votre email',
    component: EmailInscription,
  },
} as const satisfies Record<string, EmailDefinition>;

type EmailType = keyof typeof emails;

type EmailUser = Pick<User, 'id' | 'email'>;

export async function sendEmail<Type extends EmailType>(
  recipient: EmailUser,
  type: Type,
  params: Omit<ComponentProps<(typeof emails)[Type]['component']>, keyof CommonEmailProps>
) {
  const emailDefinition = emails[type];

  const html = await render(<emailDefinition.component {...commonEmailsProps} {...params} />);
  const info = await mailTransport.sendMail({
    to: recipient.email,
    from: process.env.SENDING_EMAIL,
    replyTo: process.env.REPLYTO_EMAIL,
    subject: emailDefinition.subject,
    html: html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
  });
  logger.info('send email', {
    type: type,
    recipient: recipient.id,
    messageId: info.messageId,
  });
}
