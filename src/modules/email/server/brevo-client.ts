import { serverConfig } from '@/server/config';
import { logger } from '@/server/helpers/logger';
import { dayjs } from '@/utils/date';
import { pseudonymizeEmail } from '@/utils/email';
import { FetchError, fetchJSON, fetchText } from '@/utils/network';

const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';
const BREVO_ACCOUNT_TIMEZONE = 'Europe/Paris';
const BLOCKED_CONTACTS_PAGE_SIZE = 100; // API maximum
const EVENTS_DAYS = 90; // API maximum lookback
const EVENTS_LIMIT = 200;

export type BrevoBlockedContact = {
  email: string;
  reason: { code: string };
  blockedAt: string;
};

type BrevoBlockedContactsResponse = {
  contacts?: BrevoBlockedContact[];
  count: number;
};

type BrevoEmailEvent = {
  date: string;
  event: string;
  subject?: string;
  messageId?: string;
  reason?: string;
};

type BrevoEmailEventsResponse = {
  events?: BrevoEmailEvent[];
};

export const isBrevoConfigured = () => !!serverConfig.BREVO_API_KEY;

/**
 * Brevo is inconsistent about dates: `blockedAt` is the wall-clock time of the account timezone with a
 * misleading "Z" suffix (a hard bounce at 10:17 Paris time is returned as "…T10:17:33.000Z"), while the
 * events endpoint carries a real offset ("…T10:17:33.000+02:00" for the very same bounce).
 * An explicit offset is trusted; "Z" or no suffix is read as wall-clock time in the account timezone.
 */
export const parseBrevoDate = (value: string): Date => {
  const hasExplicitOffset = /[+-]\d{2}:?\d{2}$/.test(value);
  return hasExplicitOffset ? new Date(value) : dayjs.tz(value.replace(/Z$/, ''), BREVO_ACCOUNT_TIMEZONE).toDate();
};

const getHeaders = (): Record<string, string> => ({
  accept: 'application/json',
  'api-key': serverConfig.BREVO_API_KEY ?? '',
});

/**
 * Lists every contact blocked or unsubscribed for transactional emails, walking all pages.
 * The endpoint cannot filter by email, which is why the result is mirrored in `email_blocked_contacts`.
 */
export async function listAllBlockedContacts(): Promise<BrevoBlockedContact[]> {
  const contacts: BrevoBlockedContact[] = [];
  let offset = 0;
  while (true) {
    const page = await fetchJSON<BrevoBlockedContactsResponse>(`${BREVO_API_BASE_URL}/smtp/blockedContacts`, {
      headers: getHeaders(),
      params: { limit: BLOCKED_CONTACTS_PAGE_SIZE, offset, sort: 'desc' },
    });
    const items = page.contacts ?? [];
    contacts.push(...items);
    offset += items.length;
    if (items.length < BLOCKED_CONTACTS_PAGE_SIZE || offset >= page.count) {
      break;
    }
  }
  logger.info('brevo listAllBlockedContacts', { count: contacts.length });
  return contacts;
}

/**
 * Transactional email events (requests, delivered, bounces, blocked…) for one recipient over the last 90 days.
 */
export async function listEmailEvents(email: string): Promise<BrevoEmailEvent[]> {
  const response = await fetchJSON<BrevoEmailEventsResponse>(`${BREVO_API_BASE_URL}/smtp/statistics/events`, {
    headers: getHeaders(),
    params: { days: EVENTS_DAYS, email, limit: EVENTS_LIMIT, offset: 0, sort: 'desc' },
  });
  return response.events ?? [];
}

/**
 * Removes a contact from the transactional blocklist. Returns false when Brevo did not know the contact (already unblocked).
 */
export async function unblockContact(email: string): Promise<boolean> {
  try {
    await fetchText(`${BREVO_API_BASE_URL}/smtp/blockedContacts/${encodeURIComponent(email)}`, {
      headers: getHeaders(),
      method: 'DELETE',
    });
    logger.info('brevo unblockContact', { email: pseudonymizeEmail(email) });
    return true;
  } catch (error) {
    if (error instanceof FetchError && error.status === 404) {
      return false;
    }
    throw error;
  }
}
