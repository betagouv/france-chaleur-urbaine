export enum STAT_PERIOD {
  MONTHLY = 'month',
}

export enum STAT_METHOD {
  VISIT_SUMMARY = 'VisitsSummary.getUniqueVisitors',
  MAP_VISIT_SUMMARY = 'Actions.getPageUrl',
  ACTIONS = 'Events.getAction',
}

export enum STAT_DATA {
  NB_UNIQ_VISITORS = 'nb_uniq_visitors',
  NB_VISITS = 'nb_visits',
  NB_EVENTS = 'nb_events',
}

export enum STAT_PARAMS {
  URL = '/carte',
}
