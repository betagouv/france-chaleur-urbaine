import { render } from '@react-email/components';
import AuthActivationEmail from './react-email/templates/auth/activation';
import AuthInscriptionEmail from './react-email/templates/auth/inscription';
import AuthResetPasswordEmail from './react-email/templates/auth/reset-password';
import DemandAdminAssignmentChangeEmail from './react-email/templates/demands/admin-assignment-change';
import DemandAdminNewEmail from './react-email/templates/demands/admin-new';
import DemandsGestionnaireNewEmail from './react-email/templates/demands/gestionnaire-new';
import DemandsOldDemandsEmail from './react-email/templates/demands/gestionnaire-old';
import DemandsUserNewEmail from './react-email/templates/demands/user-new';
import DemandsUserRelanceEmail from './react-email/templates/demands/user-relance';
import LegacyManagerEmail from './react-email/templates/legacy/manager-email';

export const emails = {
  'auth.activation': {
    Component: AuthActivationEmail,
    preview: 'Finalisez votre inscription en confirmant votre adresse email',
    subject: '[France Chaleur Urbaine] Confirmez votre email',
  },
  'auth.inscription': {
    Component: AuthInscriptionEmail,
    preview: 'Votre espace gestionnaire est prêt - Accédez à vos demandes dès maintenant',
    subject: '[France Chaleur Urbaine] Ouverture de votre espace gestionnaire',
  },
  'auth.reset-password': {
    Component: AuthResetPasswordEmail,
    preview: 'Sécurisez votre compte en réinitialisant votre mot de passe',
    subject: '[France Chaleur Urbaine] Réinitialisation de votre mot de passe',
  },
  'demands.admin-assignment-change': {
    Component: DemandAdminAssignmentChangeEmail,
    preview: 'Une demande a été réaffectée',
    subject: "[France Chaleur Urbaine] Changement d'affectation",
  },
  'demands.admin-new': {
    Component: DemandAdminNewEmail,
    preview: 'Une nouvelle demande de contact a été créée',
    subject: '[France Chaleur Urbaine] Nouvelle demande de contact',
  },
  'demands.gestionnaire-new': {
    Component: DemandsGestionnaireNewEmail,
    preview: 'Nouvelles demandes de raccordement à traiter dans votre espace',
    subject: '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire',
  },
  'demands.gestionnaire-old': {
    Component: DemandsOldDemandsEmail,
    preview: 'Action requise : Des demandes nécessitent votre attention',
    subject: '[France Chaleur Urbaine] Vous avez des demandes en attente de prise en charge',
  },
  'demands.user-new': {
    Component: DemandsUserNewEmail,
    preview: 'Votre demande de contact',
    subject: '[France Chaleur Urbaine] Votre demande de contact',
  },
  'demands.user-relance': {
    Component: DemandsUserRelanceEmail,
    preview: 'Mise à jour importante concernant votre demande de raccordement',
    subject: '[France Chaleur Urbaine] Votre demande',
  },
  'legacy.manager': {
    Component: LegacyManagerEmail,
    preview: 'Message important concernant votre demande de raccordement',
    subject: '',
  },
} as const;

export type EmailTemplates = typeof emails;
export type EmailType = keyof EmailTemplates;

export type TemplateProps<T extends EmailType> = React.ComponentProps<EmailTemplates[T]['Component']> & { preview?: string };

/**
 *
 * @param type Depends on
 * @param templateParams
 * @returns
 */
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
