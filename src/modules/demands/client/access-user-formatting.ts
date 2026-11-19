import { dayjs } from '@/utils/date';

/** Formats the admin-only connection detail consistently across demand views. */
export const formatLastConnection = (lastConnection: string | null) =>
  lastConnection ? `Dernière connexion le ${dayjs(lastConnection).tz('Europe/Paris').format('DD/MM/YYYY')}` : 'Jamais connecté';
