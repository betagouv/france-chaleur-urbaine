import { render } from '@react-email/components';
import React from 'react';

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
    subject: '[France Chaleur Urbaine] Confirmez votre email',
    preview: 'Finalisez votre inscription en confirmant votre adresse email',
    Component: ActivationEmail,
  },
  inscription: {
    subject: '[France Chaleur Urbaine] Ouverture de votre espace gestionnaire',
    preview: 'Votre espace gestionnaire est prêt - Accédez à vos demandes dès maintenant',
    Component: InscriptionEmail,
  },
  'manager-email': {
    subject: '',
    preview: 'Message important concernant votre demande de raccordement',
    Component: ManagerEmail,
  },
  'reset-password': {
    subject: '[France Chaleur Urbaine] Réinitialisation de votre mot de passe',
    preview: 'Sécurisez votre compte en réinitialisant votre mot de passe',
    Component: ResetPasswordEmail,
  },
  'new-demands': {
    subject: '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire',
    preview: 'Nouvelles demandes de raccordement à traiter dans votre espace',
    Component: NewDemandsEmail,
  },
  'old-demands': {
    subject: '[France Chaleur Urbaine] Vous avez des demandes en attente de prise en charge',
    preview: 'Action requise : Des demandes nécessitent votre attention',
    Component: OldDemandsEmail,
  },
  relance: {
    subject: '[France Chaleur Urbaine] Votre demande',
    preview: 'Mise à jour importante concernant votre demande de raccordement',
    Component: RelanceEmail,
  },
  'creation-demande': {
    subject: '[France Chaleur Urbaine] Votre demande de contact',
    preview: 'Votre demande de contact',
    Component: CreationDemandeEmail,
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
    subject,
    html,
    text,
  };
}
