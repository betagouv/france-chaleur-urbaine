import { DEMAND_HISTORY_START } from '@/modules/demands/constants';
import type { NetworkType } from '@/modules/reseaux/constants';
import { dayjs } from '@/utils/date';

const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;
const MONTHS_DISPLAY_FROM_DAYS = 60;
const YEARS_DISPLAY_FROM_DAYS = 2 * DAYS_PER_YEAR;

/** Month the demand audit log starts, e.g. « décembre 2025 ». */
export const historyStartLabel = dayjs(DEMAND_HISTORY_START).format('MMMM YYYY');

export const getNetworkName = (network: { name: string | null; networkId: number }) => network.name ?? `Réseau ${network.networkId}`;

/** The admin home: the dashboard every authenticated role lands on, which shows the admin pages to an admin. */
export const ADMIN_DASHBOARD_URL = '/pro/tableau-de-bord';

export const NETWORK_TRACKING_URL = '/admin/reseaux/suivi';

export const buildNetworkTrackingUrl = (networkType: NetworkType, networkId: number) =>
  `${NETWORK_TRACKING_URL}/${networkType}/${networkId}`;

/** Duration for display: in days under two months, in months under two years, in years beyond. */
export const formatDurationDays = (days: number) =>
  days < 1
    ? "moins d'un jour"
    : days < MONTHS_DISPLAY_FROM_DAYS
      ? `${Math.round(days)} j`
      : days < YEARS_DISPLAY_FROM_DAYS
        ? `${Math.round(days / DAYS_PER_MONTH)} mois`
        : `${(days / DAYS_PER_YEAR).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ans`;

/** Dates of the oldest and newest demand of a set, e.g. « 12/06/22 → 03/10/26 », or a single date when they fall on the same day. */
export const formatDateRange = (oldest: string, newest: string) => {
  const from = dayjs(oldest).format('DD/MM/YY');
  const to = dayjs(newest).format('DD/MM/YY');
  return from === to ? from : `${from} → ${to}`;
};

export const formatResponseRate = (responded: number, received: number) => `${Math.round((100 * responded) / received)} %`;
