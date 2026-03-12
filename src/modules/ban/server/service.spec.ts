import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAddressesCoordinates, getBANAddressFromAddress, getBANAddressFromCoordinates, getCoordinatesAddresses } from './service';

vi.mock('@/server/config', () => ({
  serverConfig: { banApiBaseUrl: 'https://ban.test/' },
}));

vi.mock('@/server/helpers/logger', () => ({
  parentLogger: {
    child: () => ({
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

/**
 * Génère une réponse CSV BAN à partir d'un tableau de lignes.
 * L'en-tête est déduit des clés du premier objet.
 */
function makeCSVResponse<T extends Record<string, unknown>>(rows: T[]): string {
  const header = Object.keys(rows[0]).join(',');
  const lines = rows.map((r) => Object.values(r).join(','));
  return [header, ...lines].join('\n');
}

const parisSearchRow = {
  address: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  result_city: 'Paris',
  result_label: '1 Rue de Paris 75001 Paris',
  result_score: 0.95,
  result_status: 'ok' as const,
};

const parisReverseRow = {
  latitude: 48.85,
  longitude: 2.35,
  result_city: 'Paris',
  result_label: '1 Rue de Rivoli 75001 Paris',
  result_score: 0.92,
  result_status: 'ok' as const,
};

const testSearchRow = {
  address: 'test',
  latitude: 48.85,
  longitude: 2.35,
  result_city: 'Paris',
  result_label: 'Test Paris',
  result_score: 0.9,
  result_status: 'ok' as const,
};

function mockFetchOk(body: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(body),
  });
}

function makeErrorResponse(status: number, statusText: string) {
  return {
    headers: new Headers(),
    json: () => Promise.resolve({}),
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(''),
  };
}

describe('BAN server service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getAddressesCoordinates', () => {
    it('retourne les coordonnées pour une adresse trouvée', async () => {
      global.fetch = mockFetchOk(makeCSVResponse([parisSearchRow]));

      const results = await getAddressesCoordinates('"1 rue de Paris"');

      expect(results).toStrictEqual([
        {
          address: '1 rue de Paris',
          latitude: 48.85,
          longitude: 2.35,
          result_city: 'Paris',
          result_label: '1 Rue de Paris 75001 Paris',
          result_score: 0.95,
          result_status: 'ok',
        },
      ]);

      expect(global.fetch).toHaveBeenCalledWith('https://ban.test/search/csv', expect.objectContaining({ method: 'post' }));
    });

    it('retourne un résultat avec status not-found pour une adresse introuvable', async () => {
      global.fetch = mockFetchOk(
        makeCSVResponse([
          {
            address: 'adresse introuvable xyz',
            latitude: 0,
            longitude: 0,
            result_city: '',
            result_label: '',
            result_score: 0,
            result_status: 'not-found',
          },
        ])
      );

      const results = await getAddressesCoordinates('"adresse introuvable xyz"');

      // PapaParse avec dynamicTyping convertit les chaînes vides en null
      expect(results).toStrictEqual([
        {
          address: 'adresse introuvable xyz',
          latitude: 0,
          longitude: 0,
          result_city: null,
          result_label: null,
          result_score: 0,
          result_status: 'not-found',
        },
      ]);
    });

    it('gère plusieurs adresses dans un seul appel', async () => {
      const lyonRow = {
        address: '10 avenue de Lyon',
        latitude: 45.76,
        longitude: 4.83,
        result_city: 'Lyon',
        result_label: '10 Avenue de Lyon 69001 Lyon',
        result_score: 0.88,
        result_status: 'ok',
      };
      global.fetch = mockFetchOk(makeCSVResponse([parisSearchRow, lyonRow]));

      const results = await getAddressesCoordinates('"1 rue de Paris"\n"10 avenue de Lyon"');

      expect(results).toStrictEqual([
        {
          address: '1 rue de Paris',
          latitude: 48.85,
          longitude: 2.35,
          result_city: 'Paris',
          result_label: '1 Rue de Paris 75001 Paris',
          result_score: 0.95,
          result_status: 'ok',
        },
        {
          address: '10 avenue de Lyon',
          latitude: 45.76,
          longitude: 4.83,
          result_city: 'Lyon',
          result_label: '10 Avenue de Lyon 69001 Lyon',
          result_score: 0.88,
          result_status: 'ok',
        },
      ]);
    });
  });

  describe('getCoordinatesAddresses', () => {
    it('retourne les adresses pour des coordonnées valides', async () => {
      global.fetch = mockFetchOk(makeCSVResponse([parisReverseRow]));

      const results = await getCoordinatesAddresses('48.85,2.35');

      expect(results).toStrictEqual([
        {
          address: '48.85,2.35',
          latitude: 48.85,
          longitude: 2.35,
          result_city: 'Paris',
          result_label: '1 Rue de Rivoli 75001 Paris',
          result_score: 0.92,
          result_status: 'ok',
        },
      ]);

      expect(global.fetch).toHaveBeenCalledWith('https://ban.test/reverse/csv', expect.objectContaining({ method: 'post' }));
    });

    it('conserve les coordonnées originales dans le champ address', async () => {
      global.fetch = mockFetchOk(
        makeCSVResponse([
          {
            latitude: 45.76,
            longitude: 4.83,
            result_city: 'Lyon',
            result_label: '10 Rue de la République 69001 Lyon',
            result_score: 0.85,
            result_status: 'ok',
          },
          {
            latitude: 43.6,
            longitude: 1.44,
            result_city: 'Toulouse',
            result_label: '1 Place du Capitole 31000 Toulouse',
            result_score: 0.9,
            result_status: 'ok',
          },
        ])
      );

      const results = await getCoordinatesAddresses('45.76,4.83\n43.6,1.44');

      expect(results).toStrictEqual([
        {
          address: '45.76,4.83',
          latitude: 45.76,
          longitude: 4.83,
          result_city: 'Lyon',
          result_label: '10 Rue de la République 69001 Lyon',
          result_score: 0.85,
          result_status: 'ok',
        },
        {
          address: '43.6,1.44',
          latitude: 43.6,
          longitude: 1.44,
          result_city: 'Toulouse',
          result_label: '1 Place du Capitole 31000 Toulouse',
          result_score: 0.9,
          result_status: 'ok',
        },
      ]);
    });
  });

  describe('getBANAddressFromAddress', () => {
    it('retourne la première adresse trouvée', async () => {
      global.fetch = mockFetchOk(makeCSVResponse([parisSearchRow]));

      const result = await getBANAddressFromAddress('1 rue de Paris');

      expect(result).toStrictEqual({
        address: '1 rue de Paris',
        latitude: 48.85,
        longitude: 2.35,
        result_city: 'Paris',
        result_label: '1 Rue de Paris 75001 Paris',
        result_score: 0.95,
        result_status: 'ok',
      });
    });

    it("supprime les guillemets et virgules de l'adresse", async () => {
      global.fetch = mockFetchOk(makeCSVResponse([{ ...parisSearchRow, address: '1 rue de Paris 75001 Paris' }]));

      await getBANAddressFromAddress('"1, rue de Paris", 75001 Paris');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const blob = formData.get('data') as Blob;
      const content = await blob.text();
      // Les guillemets sont supprimés et les virgules remplacées par des espaces
      expect(content).toContain('1  rue de Paris  75001 Paris');
    });
  });

  describe('getBANAddressFromCoordinates', () => {
    it('retourne la première adresse pour des coordonnées', async () => {
      global.fetch = mockFetchOk(makeCSVResponse([parisReverseRow]));

      const result = await getBANAddressFromCoordinates(48.85, 2.35);

      expect(result).toStrictEqual({
        address: '48.85,2.35',
        latitude: 48.85,
        longitude: 2.35,
        result_city: 'Paris',
        result_label: '1 Rue de Rivoli 75001 Paris',
        result_score: 0.92,
        result_status: 'ok',
      });
    });
  });

  describe("retry et gestion d'erreurs", () => {
    it('retry après une erreur 500 et réussit', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(makeErrorResponse(500, 'Internal Server Error'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(makeCSVResponse([parisSearchRow])),
        });
      global.fetch = fetchMock;

      const promise = getAddressesCoordinates('"1 rue de Paris"');
      await vi.advanceTimersByTimeAsync(3000);

      const results = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(results).toStrictEqual([parisSearchRow]);
    });

    it('retry après une erreur 504 Gateway Timeout', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(makeErrorResponse(504, 'Gateway Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(makeCSVResponse([testSearchRow])),
        });
      global.fetch = fetchMock;

      const promise = getAddressesCoordinates('"test"');
      await vi.advanceTimersByTimeAsync(3000);

      const results = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(results).toStrictEqual([testSearchRow]);
    });

    it('retry après une erreur réseau (fetch rejeté)', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(makeCSVResponse([testSearchRow])),
        });
      global.fetch = fetchMock;

      const promise = getAddressesCoordinates('"test"');
      await vi.advanceTimersByTimeAsync(3000);

      const results = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(results).toStrictEqual([testSearchRow]);
    });

    it('applique un backoff exponentiel sur les retries', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error('error 1'))
        .mockRejectedValueOnce(new Error('error 2'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(makeCSVResponse([testSearchRow])),
        });
      global.fetch = fetchMock;

      const promise = getAddressesCoordinates('"test"');

      // Après 2.9s : pas encore de retry (attempt=1, delay = max(2000, 2000*1.5^1) = 3000ms)
      await vi.advanceTimersByTimeAsync(2900);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // À 3s : premier retry
      await vi.advanceTimersByTimeAsync(200);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Deuxième retry : attempt=2, delay = max(2000, 2000*1.5^2) = 4500ms
      await vi.advanceTimersByTimeAsync(4600);

      const results = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(results).toStrictEqual([testSearchRow]);
    });

    it('échoue après le timeout total de 3 minutes', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('persistent error'));

      const promise = getAddressesCoordinates('"test"');
      const assertion = expect(promise).rejects.toThrow('Operation timed out after 180000ms');

      await vi.advanceTimersByTimeAsync(200_000);

      await assertion;
    });
  });
});
