import dayjs from 'dayjs';

import { serverConfig } from '@/server/config';
import { logger } from '@/server/helpers/logger';
import { pseudonymizeEmail } from '@/utils/email';
import { fetchJSON, postFetchJSON, putFetchJSON } from '@/utils/network';

type ContactData = {
  email: string;
  // source: string; défini en dur
  siret?: string;
  titre?: string;
  nom?: string;
  prenom?: string;
  adressePostale?: string;
  complementAdresse?: string;
  cedexBP?: string;
  codePostal?: string;
  ville?: string;
  region?: string;
  telephone?: string;
  telephonePortable?: string;
  rubriques?: string[];
  fonction?: string;
  typeOrganisme?: string;
  acceptationRGPD?: boolean;
  dateCreation?: string;
  dateModification?: string;
  dateConnexion?: string;
  abonnementNewsletter?: boolean;
  dateNewsletter?: string;
  dateFinNewsletter?: string;
  actif?: boolean;
};

type ContactResponse = {
  correlationId: string;
  success: boolean;
  timestamp: string;
  message: string;
  mail: string;
};

// Strip undefined, null, and empty string values (API rule: no empty tags)
function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

function getAuthHeaders(): Record<string, string> {
  return {
    client_id: serverConfig.ADEME_CONNECT_CLIENT_ID ?? '',
    client_secret: serverConfig.ADEME_CONNECT_CLIENT_SECRET ?? '',
  };
}

const nowIso = () => dayjs().format('YYYY-MM-DDTHH:mm:ss');

export const createContact = async (data: ContactData): Promise<ContactResponse> => {
  logger.info('ademe-connect createContact', { email: pseudonymizeEmail(data.email), type: data.typeOrganisme });
  const payload = stripEmpty({ dateCreation: nowIso(), ...data, source: serverConfig.ADEME_CONNECT_SOURCE ?? '' });
  return postFetchJSON<ContactResponse>(`${serverConfig.ADEME_CONNECT_BASE_URL}/personnes`, payload, getAuthHeaders());
};

export const updateContact = async (mail: string, data: Partial<Omit<ContactData, 'email'>>): Promise<ContactResponse> => {
  logger.info('ademe-connect updateContact', { email: pseudonymizeEmail(mail) });
  const payload = stripEmpty({ dateModification: nowIso(), email: mail, source: serverConfig.ADEME_CONNECT_SOURCE ?? '', ...data });
  return putFetchJSON<ContactResponse>(
    `${serverConfig.ADEME_CONNECT_BASE_URL}/personnes/mail/${encodeURIComponent(mail)}`,
    payload,
    getAuthHeaders()
  );
};

export const getContact = async (mail: string): Promise<unknown> => {
  logger.info('ademe-connect getContact', { email: pseudonymizeEmail(mail) });
  return fetchJSON(`${serverConfig.ADEME_CONNECT_BASE_URL}/personnes/mail/${encodeURIComponent(mail)}`, {
    headers: getAuthHeaders(),
  });
};
