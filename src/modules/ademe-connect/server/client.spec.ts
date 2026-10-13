import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchJSON, postFetchJSON, putFetchJSON } from '@/utils/network';

import { createContact, getContact, updateContact } from './client';

const serverConfigMock = vi.hoisted(
  (): {
    ADEME_CONNECT_BASE_URL: string;
    ADEME_CONNECT_CLIENT_ID: string | undefined;
    ADEME_CONNECT_CLIENT_SECRET: string | undefined;
    ADEME_CONNECT_SOURCE: string;
  } => ({
    ADEME_CONNECT_BASE_URL: 'https://ademe.test/api/v1',
    ADEME_CONNECT_CLIENT_ID: 'client-id',
    ADEME_CONNECT_CLIENT_SECRET: 'client-secret',
    ADEME_CONNECT_SOURCE: 'France Chaleur Urbaine',
  })
);

vi.mock('@/server/config', () => ({
  serverConfig: serverConfigMock,
}));

vi.mock('@/server/helpers/logger', () => ({
  logger: { info: vi.fn() },
}));

vi.mock('@/utils/network', () => ({
  fetchJSON: vi.fn(),
  postFetchJSON: vi.fn(),
  putFetchJSON: vi.fn(),
}));

const authHeaders = { client_id: 'client-id', client_secret: 'client-secret' };
const queueAck = { correlationId: 'c1', mail: 'jean@example.com', message: 'queued', success: true, timestamp: '2026-10-08T10:00:00' };

describe('ademe-connect client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T10:00:00'));
    serverConfigMock.ADEME_CONNECT_CLIENT_ID = 'client-id';
    serverConfigMock.ADEME_CONNECT_CLIENT_SECRET = 'client-secret';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createContact', () => {
    it('posts the contact with the source, a creation date and the auth headers, without empty fields', async () => {
      vi.mocked(postFetchJSON).mockResolvedValue(queueAck);

      const result = await createContact({
        abonnementNewsletter: false,
        email: 'jean@example.com',
        nom: 'Dupont',
        prenom: '',
        rubriques: ['FCU - rôle particulier'],
        telephone: undefined,
        typeOrganisme: 'Particulier',
      });

      expect(result).toStrictEqual(queueAck);
      expect(vi.mocked(postFetchJSON).mock.calls).toStrictEqual([
        [
          'https://ademe.test/api/v1/personnes',
          {
            abonnementNewsletter: false,
            dateCreation: '2026-10-08T10:00:00',
            email: 'jean@example.com',
            nom: 'Dupont',
            rubriques: ['FCU - rôle particulier'],
            source: 'France Chaleur Urbaine',
            typeOrganisme: 'Particulier',
          },
          authHeaders,
        ],
      ]);
    });

    it('keeps an explicit creation date', async () => {
      vi.mocked(postFetchJSON).mockResolvedValue(queueAck);

      await createContact({ dateCreation: '2024-01-15T08:30:00', email: 'jean@example.com' });

      expect(vi.mocked(postFetchJSON).mock.calls[0][1]).toStrictEqual({
        dateCreation: '2024-01-15T08:30:00',
        email: 'jean@example.com',
        source: 'France Chaleur Urbaine',
      });
    });

    it('is a no-op without credentials', async () => {
      serverConfigMock.ADEME_CONNECT_CLIENT_ID = undefined;

      const result = await createContact({ email: 'jean@example.com' });

      expect(result).toStrictEqual(null);
      expect(vi.mocked(postFetchJSON).mock.calls).toStrictEqual([]);
    });
  });

  describe('updateContact', () => {
    it('puts the contact by encoded email with a modification date and keeps false booleans (abonnementNewsletter: false)', async () => {
      vi.mocked(putFetchJSON).mockResolvedValue(queueAck);

      const result = await updateContact('jean+fcu@example.com', {
        abonnementNewsletter: false,
        nom: null as unknown as undefined,
        telephone: '',
      });

      expect(result).toStrictEqual(queueAck);
      expect(vi.mocked(putFetchJSON).mock.calls).toStrictEqual([
        [
          'https://ademe.test/api/v1/personnes/mail/jean%2Bfcu%40example.com',
          {
            abonnementNewsletter: false,
            dateModification: '2026-10-08T10:00:00',
            email: 'jean+fcu@example.com',
            source: 'France Chaleur Urbaine',
          },
          authHeaders,
        ],
      ]);
    });

    it('is a no-op without credentials', async () => {
      serverConfigMock.ADEME_CONNECT_CLIENT_SECRET = undefined;

      const result = await updateContact('jean@example.com', { abonnementNewsletter: false });

      expect(result).toStrictEqual(null);
      expect(vi.mocked(putFetchJSON).mock.calls).toStrictEqual([]);
    });
  });

  describe('getContact', () => {
    it('fetches the contact by encoded email with the auth headers', async () => {
      vi.mocked(fetchJSON).mockResolvedValue({ mail: 'jean@example.com' });

      const result = await getContact('jean@example.com');

      expect(result).toStrictEqual({ mail: 'jean@example.com' });
      expect(vi.mocked(fetchJSON).mock.calls).toStrictEqual([
        ['https://ademe.test/api/v1/personnes/mail/jean%40example.com', { headers: authHeaders }],
      ]);
    });

    it('throws without credentials (manual command, the error must be visible)', async () => {
      serverConfigMock.ADEME_CONNECT_CLIENT_ID = undefined;

      await expect(getContact('jean@example.com')).rejects.toThrow('ADEME Connect is not configured');
    });
  });
});
