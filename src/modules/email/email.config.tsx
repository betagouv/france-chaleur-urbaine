import { render } from '@react-email/components';

import type { EmailScenarios } from '@/modules/email/scenarios';
import { ObjectEntries, ObjectKeys } from '@/utils/typescript';

import OuvertureEspaceGestionnaire, { scenarios as ouvertureEspaceScenarios } from './templates/auth/gestionnaire/ouverture-espace';
import ConfirmationInscription, {
  scenarios as confirmationInscriptionScenarios,
} from './templates/auth/utilisateur/confirmation-inscription';
import ReinitialisationMotDePasse, {
  scenarios as reinitialisationMotDePasseScenarios,
} from './templates/auth/utilisateur/reinitialisation-mot-de-passe';
import ConfirmationDemande, { scenarios as confirmationDemandeScenarios } from './templates/demands/demandeur/confirmation-demande';
import EnqueteSatisfaction, { scenarios as enqueteSatisfactionScenarios } from './templates/demands/demandeur/enquete-satisfaction';
import MessageGestionnaire, { scenarios as messageGestionnaireScenarios } from './templates/demands/demandeur/message-gestionnaire';
import NouvellesDemandesATraiter, {
  scenarios as nouvellesDemandesATraiterScenarios,
} from './templates/demands/gestionnaire/nouvelles-demandes-a-traiter';
import RappelDemandesEnAttente, {
  scenarios as rappelDemandesEnAttenteScenarios,
} from './templates/demands/gestionnaire/rappel-demandes-en-attente';

/**
 * Définition d'un modèle d'email. Le générique `C` lie le composant React
 * à ses scénarios (props pré-paramétrées) — passer un mauvais jeu de props
 * dans `scenarios` est rejeté à la compilation.
 */
type EmailDefinition<C extends React.ComponentType<any>> = {
  Component: C;
  scenarios: EmailScenarios<C>;
  label: string;
  description: string;
  subject: string;
  preview: string;
};

/**
 * Contrainte récursive qui force chaque entrée du registre à être une
 * `EmailDefinition<C>` cohérente : `scenarios` doit matcher les props du
 * `Component` de la même entrée, sinon TypeScript rejette à la compilation.
 */
type EmailRegistry<T> = {
  [K in keyof T]: T[K] extends { Component: infer C extends React.ComponentType<any> } ? EmailDefinition<C> : never;
};

/**
 * Helper pour déclarer le registre des emails en une fois, avec inférence
 * fine du type de chaque composant (pour valider statiquement la cohérence
 * `Component` ↔ `scenarios`) et préservation des clés littérales.
 */
function defineEmails<const T extends EmailRegistry<T>>(emails: T): T {
  return emails;
}

/**
 * Registre central des modèles d'emails de l'application.
 *
 * Chaque entrée associe une clé `<module>.<destinataire>.<intention>` à :
 * - le composant React qui produit le rendu HTML/texte ;
 * - les `scenarios` (props pré-remplies pour la prévisualisation admin) ;
 * - les métadonnées affichées dans l'admin (`label`, `description`, `subject`, `preview`).
 */
export const emails = defineEmails({
  'auth.gestionnaire.ouverture-espace': {
    Component: OuvertureEspaceGestionnaire,
    description:
      "Envoyé manuellement par un admin via la page de gestion des utilisateurs, lorsqu'il crée un compte gestionnaire. Le destinataire doit ensuite cliquer sur « Mot de passe oublié » pour définir son mot de passe.",
    label: "Ouverture d'espace gestionnaire",
    preview: 'Votre espace gestionnaire est prêt - Accédez à vos demandes dès maintenant',
    scenarios: ouvertureEspaceScenarios,
    subject: '[France Chaleur Urbaine] Ouverture de votre espace gestionnaire',
  },
  'auth.utilisateur.confirmation-inscription': {
    Component: ConfirmationInscription,
    description:
      "Envoyé automatiquement à toute personne qui s'inscrit publiquement, contient un lien à cliquer pour confirmer son adresse email et activer son compte.",
    label: "Confirmation d'inscription",
    preview: 'Finalisez votre inscription en confirmant votre adresse email',
    scenarios: confirmationInscriptionScenarios,
    subject: '[France Chaleur Urbaine] Confirmez votre email',
  },
  'auth.utilisateur.reinitialisation-mot-de-passe': {
    Component: ReinitialisationMotDePasse,
    description: 'Envoyé à tout utilisateur ayant cliqué sur « Mot de passe oublié ». Lien valide 3 heures.',
    label: 'Réinitialisation du mot de passe',
    preview: 'Sécurisez votre compte en réinitialisant votre mot de passe',
    scenarios: reinitialisationMotDePasseScenarios,
    subject: '[France Chaleur Urbaine] Réinitialisation de votre mot de passe',
  },
  'demands.demandeur.confirmation-demande': {
    Component: ConfirmationDemande,
    description:
      "Accusé de réception envoyé au demandeur juste après dépôt. Contient une analyse d'éligibilité personnalisée (proche / intermédiaire / éloigné) selon la distance au réseau, le type de bâtiment et le département.",
    label: 'Confirmation de demande + éligibilité',
    preview: 'Votre demande de contact',
    scenarios: confirmationDemandeScenarios,
    subject: '[France Chaleur Urbaine] Votre demande de contact',
  },
  'demands.demandeur.enquete-satisfaction': {
    Component: EnqueteSatisfaction,
    description: "Relance envoyée au demandeur pour vérifier s'il a bien été contacté par le gestionnaire et recueillir son retour.",
    label: 'Enquête de satisfaction',
    preview: 'Mise à jour importante concernant votre demande de raccordement',
    scenarios: enqueteSatisfactionScenarios,
    subject: '[France Chaleur Urbaine] Votre demande',
  },
  'demands.demandeur.message-gestionnaire': {
    Component: MessageGestionnaire,
    description:
      'Email à contenu libre envoyé par un gestionnaire au demandeur via la plateforme FCU (le sujet et le corps sont rédigés par le gestionnaire).',
    label: 'Message libre du gestionnaire',
    preview: 'Message important concernant votre demande de raccordement',
    scenarios: messageGestionnaireScenarios,
    subject: '',
  },
  'demands.gestionnaire.nouvelles-demandes-a-traiter': {
    Component: NouvellesDemandesATraiter,
    description: 'Envoyé périodiquement aux gestionnaires de réseau ayant une ou plusieurs nouvelles demandes dans leur espace.',
    label: 'Nouvelles demandes à traiter',
    preview: 'Nouvelles demandes de raccordement à traiter dans votre espace',
    scenarios: nouvellesDemandesATraiterScenarios,
    subject: '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire',
  },
  'demands.gestionnaire.rappel-demandes-en-attente': {
    Component: RappelDemandesEnAttente,
    description: 'Relance envoyée aux gestionnaires ayant des demandes encore au statut « En attente de prise en charge ».',
    label: 'Rappel demandes en attente',
    preview: 'Action requise : Des demandes nécessitent votre attention',
    scenarios: rappelDemandesEnAttenteScenarios,
    subject: '[France Chaleur Urbaine] Vous avez des demandes en attente de prise en charge',
  },
});

type EmailTemplates = typeof emails;
export type EmailType = keyof EmailTemplates;

type TemplateProps<T extends EmailType> = React.ComponentProps<EmailTemplates[T]['Component']> & { preview?: string };

/**
 * Retourne la liste des modèles d'emails enregistrés avec leurs métadonnées,
 * destinée à l'admin (sidebar + panneau d'aperçu). Le HTML rendu n'est pas
 * inclus ici — il est récupéré à la demande via `renderEmailScenario`.
 */
export function listEmailTypes(): Array<{
  type: EmailType;
  label: string;
  description: string;
  subject: string;
  scenarios: Array<{ key: string; label: string }>;
}> {
  return ObjectKeys(emails).map((type) => ({
    description: emails[type].description,
    label: emails[type].label,
    scenarios: ObjectEntries(emails[type].scenarios).map(([key, { label }]) => ({ key, label })),
    subject: emails[type].subject,
    type,
  }));
}

/**
 * Rend un email en HTML et texte plain à partir de ses props finales.
 * Utilisé en production par `sendEmailTemplate` pour générer le contenu
 * effectivement envoyé.
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

/**
 * Rend un email en réutilisant un scénario nommé enregistré dans la config.
 * Utilisé par l'admin pour prévisualiser un cas de figure pré-paramétré
 * (ex: les 22 variantes d'éligibilité de `confirmation-demande`).
 */
export async function renderEmailScenario<T extends EmailType>(type: T, scenarioKey: string) {
  const scenario = emails[type].scenarios[scenarioKey];
  if (!scenario) {
    throw new Error(`Unknown scenario "${scenarioKey}" for email "${type}"`);
  }
  return renderEmail(type, scenario.props as TemplateProps<T>);
}
