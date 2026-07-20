import { render } from '@react-email/components';

import { businessRules } from '@/modules/app/business-rules';
import type { EmailTrigger } from '@/modules/email/constants';
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
import NouvelleDemandeChaleurRenouvelable, {
  scenarios as nouvelleDemandeChaleurRenouvelableScenarios,
} from './templates/demands/equipe-fcu/nouvelle-demande-chaleur-renouvelable';
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
  trigger: EmailTrigger;
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
    trigger: {
      description: "À la création par un admin d'un compte gestionnaire actif — les autres rôles ne reçoivent aucun email.",
      type: 'action',
    },
  },
  'auth.utilisateur.confirmation-inscription': {
    Component: ConfirmationInscription,
    description:
      "Envoyé automatiquement à toute personne qui s'inscrit publiquement, contient un lien à cliquer pour confirmer son adresse email et activer son compte.",
    label: "Confirmation d'inscription",
    preview: 'Finalisez votre inscription en confirmant votre adresse email',
    scenarios: confirmationInscriptionScenarios,
    subject: '[France Chaleur Urbaine] Confirmez votre email',
    trigger: {
      description: "À l'inscription publique sur /inscription (particulier ou professionnel).",
      type: 'action',
    },
  },
  'auth.utilisateur.reinitialisation-mot-de-passe': {
    Component: ReinitialisationMotDePasse,
    description: 'Envoyé à tout utilisateur ayant cliqué sur « Mot de passe oublié ». Lien valide 3 heures.',
    label: 'Réinitialisation du mot de passe',
    preview: 'Sécurisez votre compte en réinitialisant votre mot de passe',
    scenarios: reinitialisationMotDePasseScenarios,
    subject: '[France Chaleur Urbaine] Réinitialisation de votre mot de passe',
    trigger: {
      description: 'Au clic sur « Mot de passe oublié », uniquement si le compte existe et est actif.',
      type: 'action',
    },
  },
  'demands.demandeur.confirmation-demande': {
    Component: ConfirmationDemande,
    description:
      "Accusé de réception envoyé au demandeur juste après dépôt. Contient une analyse d'éligibilité personnalisée (proche / intermédiaire / éloigné) selon la distance au réseau, le type de bâtiment et le département.",
    label: 'Confirmation de demande + éligibilité',
    preview: 'Votre demande de contact',
    scenarios: confirmationDemandeScenarios,
    subject: '[France Chaleur Urbaine] Votre demande de contact',
    trigger: {
      description: "Au dépôt d'une demande de raccordement (formulaire public ou espace connecté).",
      type: 'action',
    },
  },
  'demands.demandeur.enquete-satisfaction': {
    Component: EnqueteSatisfaction,
    description: "Relance envoyée au demandeur pour vérifier s'il a bien été contacté par le gestionnaire et recueillir son retour.",
    label: 'Enquête de satisfaction',
    preview: 'Mise à jour importante concernant votre demande de raccordement',
    scenarios: enqueteSatisfactionScenarios,
    subject: '[France Chaleur Urbaine] Votre demande',
    trigger: {
      description: `Cron du lundi 10h05 — à ${businessRules.firstRelanceDelayMonths.display} puis ${businessRules.secondRelanceDelayDays.display} après le dépôt, si le demandeur n'est pas marqué comme recontacté (demandes éligibles en chauffage collectif uniquement).`,
      type: 'cron',
    },
  },
  'demands.demandeur.message-gestionnaire': {
    Component: MessageGestionnaire,
    description:
      'Email à contenu libre envoyé par un gestionnaire au demandeur via la plateforme FCU (le sujet et le corps sont rédigés par le gestionnaire).',
    label: 'Message libre du gestionnaire',
    preview: 'Message important concernant votre demande de raccordement',
    scenarios: messageGestionnaireScenarios,
    subject: '',
    trigger: {
      description: "À l'envoi manuel par un gestionnaire depuis sa liste de demandes.",
      type: 'action',
    },
  },
  'demands.equipe-fcu.nouvelle-demande-chaleur-renouvelable': {
    Component: NouvelleDemandeChaleurRenouvelable,
    description: 'Notification interne envoyée à france.chaleur.urbaine@gmail.com à chaque nouvelle demande chaleur renouvelable reçue.',
    label: 'Nouvelle demande chaleur renouvelable',
    preview: 'Une nouvelle demande chaleur renouvelable est à traiter',
    scenarios: nouvelleDemandeChaleurRenouvelableScenarios,
    subject: '[France Chaleur Urbaine] Nouvelle demande chaleur renouvelable à traiter',
    trigger: {
      description: "Au dépôt d'une demande sur le parcours chaleur renouvelable, envoyé à l'équipe FCU.",
      type: 'action',
    },
  },
  'demands.gestionnaire.nouvelles-demandes-a-traiter': {
    Component: NouvellesDemandesATraiter,
    description: 'Envoyé périodiquement aux gestionnaires de réseau ayant une ou plusieurs nouvelles demandes dans leur espace.',
    label: 'Nouvelles demandes à traiter',
    preview: 'Nouvelles demandes de raccordement à traiter dans votre espace',
    scenarios: nouvellesDemandesATraiterScenarios,
    subject: '[France Chaleur Urbaine] Nouvelle(s) demande(s) dans votre espace gestionnaire',
    trigger: {
      description:
        "Cron du lundi au vendredi 10h — demandes validées, affectées à un réseau du gestionnaire et non encore notifiées ; nécessite l'option « recevoir les nouvelles demandes ».",
      type: 'cron',
    },
  },
  'demands.gestionnaire.rappel-demandes-en-attente': {
    Component: RappelDemandesEnAttente,
    description: 'Relance envoyée aux gestionnaires ayant des demandes encore au statut « À traiter ».',
    label: 'Rappel demandes en attente',
    preview: 'Action requise : Des demandes nécessitent votre attention',
    scenarios: rappelDemandesEnAttenteScenarios,
    subject: '[France Chaleur Urbaine] Vous avez des demandes en attente de prise en charge',
    trigger: {
      description: `Cron du mardi 9h55 — demandes « À traiter » notifiées depuis plus de ${businessRules.unhandledDemandReminderDays.display} ; nécessite l'option « recevoir les rappels ».`,
      type: 'cron',
    },
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
  trigger: EmailTrigger;
}> {
  return ObjectKeys(emails).map((type) => ({
    description: emails[type].description,
    label: emails[type].label,
    scenarios: ObjectEntries(emails[type].scenarios).map(([key, { label }]) => ({ key, label })),
    subject: emails[type].subject,
    trigger: emails[type].trigger,
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
