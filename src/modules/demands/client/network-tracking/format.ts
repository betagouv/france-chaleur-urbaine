import { DEMAND_HISTORY_START } from '@/modules/demands/constants';
import type { NetworkType } from '@/modules/reseaux/constants';
import { dayjs } from '@/utils/date';

const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;
const MONTHS_DISPLAY_FROM_DAYS = 60;
const YEARS_DISPLAY_FROM_DAYS = 2 * DAYS_PER_YEAR;

/** Month the demand audit log starts, e.g. « décembre 2025 ». */
export const historyStartLabel = dayjs(DEMAND_HISTORY_START).format('MMMM YYYY');

export const buildNetworkTrackingUrl = (networkType: NetworkType, networkId: number) => `/admin/reseaux/suivi/${networkType}/${networkId}`;

/** Duration for display: in days under two months, in months under two years, in years beyond. */
export const formatDurationDays = (days: number) =>
  days < 1
    ? "moins d'un jour"
    : days < MONTHS_DISPLAY_FROM_DAYS
      ? `${Math.round(days)} j`
      : days < YEARS_DISPLAY_FROM_DAYS
        ? `${Math.round(days / DAYS_PER_MONTH)} mois`
        : `${(days / DAYS_PER_YEAR).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ans`;

/** Time elapsed since a date, formatted as a duration. */
export const formatElapsedSince = (date: string) => formatDurationDays(dayjs().diff(date, 'day', true));

export const formatResponseRate = (responded: number, received: number) => `${Math.round((100 * responded) / received)} %`;
