export enum STAT_PERIOD {
  MONTHLY = 'month',
}

export enum STAT_METHOD {
  VISIT_SUMMARY = 'VisitsSummary.getUniqueVisitors',
  MAP_VISIT_SUMMARY = 'Actions.getPageUrl',
  ACTIONS = 'Events.getAction',
  AIRTABLE = 'Airtable',
  DATABASE = 'Database',
}

export enum STAT_KEY {
  NB_UNIQ_VISITORS = 'nb_uniq_visitors',
  NB_VISITS = 'nb_visits',
  NB_EVENTS = 'nb_events',
  NB_CONTACTS = 'count_contacts',
  BULK_CONTACTS = 'count_bulk_contact',
  NB_ACCOUNTS_PRO_CREATED = 'nb_accounts_pro_created',
  NB_ACCOUNTS_PARTICULIER_CREATED = 'nb_accounts_particulier_created',
}

export enum STAT_PARAMS {
  URL = '/carte',
}

export enum STAT_LABEL {
  NB_ELIGIBLE = 'nbEligible',
  NB_UNELIGIBLE = 'nbUneligible',
  NB_TOTAL = 'nbTotal',
  FORM_TEST_UNELIGIBLE = 'Formulaire de test - Adresse Inéligible',
  FORM_TEST_ELIGIBLE = 'Formulaire de test - Adresse Éligible',
  FORM_TEST_CARTE_UNELIGIBLE = 'Formulaire de test - Carte - Adresse Inéligible',
  FORM_TEST_CARTE_ELIGIBLE = 'Formulaire de test - Carte - Adresse Éligible',
  FORM_TEST_FICHE_RESEAU_UNELIGIBLE = 'Formulaire de test - Fiche réseau - Adresse Inéligible',
  FORM_TEST_FICHE_RESEAU_ELIGIBLE = 'Formulaire de test - Fiche réseau - Adresse Éligible',
  FORM_TEST_COMPARATEUR_UNELIGIBLE = 'Formulaire de test - Comparateur - Adresse Inéligible',
  FORM_TEST_COMPARATEUR_ELIGIBLE = 'Formulaire de test - Comparateur - Adresse Éligible',
  TRACES = 'Tracés',
}

export enum STAT_COMMUNES_SANS_RESEAU {
  NB_TESTS = 'Villes Potentiel - Visites',
  NB_DEMANDES = 'Villes Potentiel - Demandes',
}
