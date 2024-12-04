// fetchFromMatomo Events.getAction https://stats.data.gouv.fr?token_auth=AAAAAAAAAAAAAAAA&idSite=192&format=JSON&module=API&method=API.getBulkRequest&period=month&urls[0]=method%3DEvents.getAction%26period%3Dmonth%26date%3D2024-01-01
export interface MatomoActionMetrics {
  label: string;
  nb_visits: number;
  nb_events: number;
  nb_events_with_value: number;
  sum_event_value: number;
  min_event_value: number;
  max_event_value: boolean;
  sum_daily_nb_uniq_visitors: number;
  avg_event_value: number;
  segment: string;
  idsubdatatable?: number;
}

// fetchFromMatomo Actions.getPageUrl https://stats.data.gouv.fr?token_auth=AAAAAAAAAAAAAAAA&idSite=192&format=JSON&module=API&method=API.getBulkRequest&pageUrl=/carte&period=month&urls[0]=method%3DActions.getPageUrl%26pageUrl%3D%2Fcarte%26period%3Dmonth%26date%3D2024-01-01
export interface MatomoPageMetrics {
  label: string;
  nb_visits: number;
  nb_hits: number;
  sum_time_spent: number;
  entry_nb_visits: number;
  entry_nb_actions: number;
  entry_sum_visit_length: number;
  entry_bounce_count: number;
  exit_nb_visits: number;
  sum_daily_nb_uniq_visitors: number;
  sum_daily_entry_nb_uniq_visitors: number;
  sum_daily_exit_nb_uniq_visitors: number;
  avg_time_on_page: number;
  bounce_rate: string;
  exit_rate: string;
  url: string;
}

// fetchFromMatomo VisitsSummary.getUniqueVisitors https://stats.data.gouv.fr?token_auth=AAAAAAAAAAAAAAAA&idSite=192&format=JSON&module=API&method=API.getBulkRequest&period=month&urls[0]=method%3DVisitsSummary.getUniqueVisitors%26period%3Dmonth%26date%3D2024-01-01
export interface MatomoUniqueVisitorsMetrics {
  value: number;
}

export interface MatomoErrorResult {
  result: 'error';
  message: string;
}

export type MatomoMonthStat = Record<string, number | null> & {
  date: string;
};
