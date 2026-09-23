import { businessRules } from '@/modules/app/business-rules';

export const retentionRules = ['pending_accounts', 'inactive_accounts', 'closed_demands'] as const;
export type RetentionRule = (typeof retentionRules)[number];

export type RetentionTransformation = { field: string; after: string };

export type RetentionRuleDefinition = {
  /** What the archiving does to the matching rows. */
  action: string;
  description: string;
  ruleId: keyof typeof businessRules;
  title: string;
  /** Field-level effect of the archiving, shown before confirmation. */
  transformations: RetentionTransformation[];
};

/** Client-safe catalog of the retention rules shown on the admin page; durations come from the business rules. */
export const retentionRuleDefinitions: Record<RetentionRule, RetentionRuleDefinition> = {
  closed_demands: {
    action: 'Anonymisation : nom, prénom, email, téléphone et commentaires effacés ; adresse, réseau, statut et dates conservés',
    description: `Demandes closes (réalisées, non réalisables ou abandonnées) déposées il y a plus de , ou supprimées depuis plus de `,
    ruleId: 'retentionDemandsClosedYears',
    title: 'Demandes closes',
    transformations: [
      { after: '« Anonymisé »', field: 'Nom' },
      { after: 'vide', field: 'Prénom' },
      { after: 'anonymise-<identifiant>@anonymise.invalid', field: 'Mail' },
      { after: 'vide', field: 'Téléphone' },
      { after: 'vide', field: 'Commentaire du demandeur, du gestionnaire et de FCU' },
      { after: 'conservés', field: 'Adresse, réseau, statut, dates, logements, mode de chauffage, origine' },
    ],
  },
  inactive_accounts: {
    action:
      'Désactivation et anonymisation du compte : email, identité, téléphone et signature effacés, mot de passe invalidé ; les demandes rattachées restent liées',
    description: `Comptes sans connexion depuis plus de ${businessRules.retentionAccountsInactiveYears.display} (administrateurs exclus)`,
    ruleId: 'retentionAccountsInactiveYears',
    title: 'Comptes inactifs',
    transformations: [
      { after: 'anonymise-<identifiant>@anonymise.invalid', field: 'Email' },
      { after: 'vide', field: 'Prénom, nom, téléphone, signature' },
      { after: 'remplacé par une valeur aléatoire inconnue (connexion impossible)', field: 'Mot de passe' },
      { after: "désactivé, abonnement à la lettre d'information retiré", field: 'Compte' },
      { after: 'conservés et toujours rattachés au compte', field: "Rôle, structure, permissions, demandes, tests d'adresses" },
    ],
  },
  pending_accounts: {
    action: 'Suppression du compte',
    description: `Comptes créés depuis plus de ${businessRules.retentionAccountsPendingMonths.display} dont l'email n'a jamais été confirmé`,
    ruleId: 'retentionAccountsPendingMonths',
    title: 'Comptes jamais activés',
    transformations: [{ after: 'supprimé définitivement (aucune demande ni donnée rattachée à un compte jamais activé)', field: 'Compte' }],
  },
};
