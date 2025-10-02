import { render } from '@react-email/components';
import type React from 'react';

import CreationDemandeEmail from '@/server/email/react-email/templates/creation-demande';

import ActivationEmail from './templates/activation';
import InscriptionEmail from './templates/inscription';
import ManagerEmail from './templates/manager-email';
import NewDemandsEmail from './templates/new-demands';
import OldDemandsEmail from './templates/old-demands';
import RelanceEmail from './templates/relance';
import ResetPasswordEmail from './templates/reset-password';

export const emails = {
  activation: {
    Component: ActivationEmail,
    preview: 'Finalisez votre inscription en confirmant votre adresse email',
    subject: '[France Chaleur Urbaine] Confirmez votre email',
  },
  'creation-demande': {
    Component: CreationDemandeEmail,
    preview: 'Votre demande de contact',
    subject: '[France Chaleur Urbaine] Votre demande de contact',
  },
  inscription: {
    Component: InscriptionEmail,
    preview: 'Votre espace gestionnaire est prêt - Accédez à vos demandes dès maintenant',
    subject: '[France Chaleur Urbaine] Ouverture de votre espace gestionnaire',
  },
  'manager-email': {
    Component: ManagerEmail,
    preview: 'Message important concernant votre demande de raccordement',
    subject: '',
  },
  'new-demands': {
    Component: NewDemandsEmail,
    preview: 'Nouvelles demandes de raccordement à traiter dans votre espace',
    subject: '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire',
  },
  'old-demands': {
    Component: OldDemandsEmail,
    preview: 'Action requise : Des demandes nécessitent votre attention',
    subject: '[France Chaleur Urbaine] Vous avez des demandes en attente de prise en charge',
  },
  relance: {
    Component: RelanceEmail,
    preview: 'Mise à jour importante concernant votre demande de raccordement',
    subject: '[France Chaleur Urbaine] Votre demande',
  },
  'reset-password': {
    Component: ResetPasswordEmail,
    preview: 'Sécurisez votre compte en réinitialisant votre mot de passe',
    subject: '[France Chaleur Urbaine] Réinitialisation de votre mot de passe',
  },
} as const;

type EmailsMap = typeof emails;
export type EmailType = keyof EmailsMap;
type TemplateProps<T extends EmailType> = React.ComponentProps<EmailsMap[T]['Component']> & { preview?: string };

export async function renderEmail<T extends EmailType>(type: T, templateParams: TemplateProps<T>) {
  const { preview, subject, Component } = emails[type];

  const email = <Component {...(templateParams as any)} preview={templateParams?.preview || preview} />;

  const [html, text] = await Promise.all([render(email), render(email, { plainText: true })]);

  return {
    html,
    subject,
    text,
  };
}
