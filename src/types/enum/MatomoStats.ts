export const STAT_PERIOD = {
  DAILY: 'day',
  MONTHLY: 'month',
} as const;
export type STAT_PERIOD = (typeof STAT_PERIOD)[keyof typeof STAT_PERIOD];

export const STAT_METHOD = {
  ACTIONS: 'Events.getAction',
  ACTIONS_CATEGORY: 'Events.getCategory',
  DATABASE: 'Database',
  DEMANDS: 'Airtable', // value kept from when demands lived in Airtable: stored in every matomo_stats demands row
  GRIST: 'Grist',
  MAP_VISIT_SUMMARY: 'Actions.getPageUrl',
  VISIT_SUMMARY: 'VisitsSummary.getUniqueVisitors',
} as const;
export type STAT_METHOD = (typeof STAT_METHOD)[keyof typeof STAT_METHOD];

export const STAT_KEY = {
  BULK_CONTACTS: 'count_bulk_contact',
  NB_ACCOUNTS_PARTICULIER_CREATED: 'nb_accounts_particulier_created',
  NB_ACCOUNTS_PRO_CREATED: 'nb_accounts_pro_created',
  NB_CONTACTS: 'count_contacts',
  NB_EVENTS: 'nb_events',
  NB_UNIQ_VISITORS: 'nb_uniq_visitors',
  NB_VISITS: 'nb_visits',
} as const;
export type STAT_KEY = (typeof STAT_KEY)[keyof typeof STAT_KEY];

export const STAT_PARAMS = {
  URL: '/carte',
} as const;
export type STAT_PARAMS = (typeof STAT_PARAMS)[keyof typeof STAT_PARAMS];

export const STAT_LABEL = {
  FORM_TEST_CARTE_ELIGIBLE: 'Formulaire de test - Carte - Adresse Éligible',
  FORM_TEST_CARTE_UNELIGIBLE: 'Formulaire de test - Carte - Adresse Inéligible',
  FORM_TEST_COMPARATEUR_ELIGIBLE: 'Formulaire de test - Comparateur - Adresse Éligible',
  FORM_TEST_COMPARATEUR_UNELIGIBLE: 'Formulaire de test - Comparateur - Adresse Inéligible',
  FORM_TEST_ELIGIBLE: 'Formulaire de test - Adresse Éligible',
  FORM_TEST_FICHE_RESEAU_ELIGIBLE: 'Formulaire de test - Fiche réseau - Adresse Éligible',
  FORM_TEST_FICHE_RESEAU_UNELIGIBLE: 'Formulaire de test - Fiche réseau - Adresse Inéligible',
  FORM_TEST_UNELIGIBLE: 'Formulaire de test - Adresse Inéligible',
  NB_ELIGIBLE: 'nbEligible',
  NB_TOTAL: 'nbTotal',
  NB_UNELIGIBLE: 'nbUneligible',
  TRACES: 'Tracés',
} as const;
export type STAT_LABEL = (typeof STAT_LABEL)[keyof typeof STAT_LABEL];

export const STAT_COMMUNES_SANS_RESEAU = {
  NB_DEMANDES: 'Villes Potentiel - Demandes',
  NB_TESTS: 'Villes Potentiel - Visites',
} as const;
export type STAT_COMMUNES_SANS_RESEAU = (typeof STAT_COMMUNES_SANS_RESEAU)[keyof typeof STAT_COMMUNES_SANS_RESEAU];
