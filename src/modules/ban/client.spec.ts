import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BAN_MIN_QUERY_LENGTH, searchBANAddresses } from './client';
import type { BANAddressFeature } from './types';

// Mock fetchJSON to control network responses
const fetchJSONMock = vi.fn();
vi.mock('@/utils/network', () => ({
  fetchJSON: (...args: Parameters<typeof import('@/utils/network').fetchJSON>) => fetchJSONMock(...args),
}));

vi.mock('@/client-config', () => ({
  clientConfig: { banApiBaseUrl: 'https://ban.test/' },
}));

const makeFeature = (overrides: Partial<BANAddressFeature['properties']> = {}): BANAddressFeature => ({
  geometry: { coordinates: [2.35, 48.85], type: 'Point' },
  properties: {
    city: 'Paris',
    citycode: '75101',
    context: '75, Paris, Île-de-France',
    housenumber: '1',
    id: '75101_1234',
    importance: 0.7,
    label: '1 rue de Paris',
    name: '1 rue de Paris',
    postcode: '75001',
    score: 0.9,
    street: 'rue de Paris',
    type: 'housenumber',
    x: 2.35,
    y: 48.85,
    ...overrides,
  },
  type: 'Feature',
});

const makeBanResponse = (features: BANAddressFeature[] = []) => ({
  attribution: '',
  features,
  licence: '',
  limit: 10,
  query: 'test',
  type: 'FeatureCollection' as const,
  version: '1',
});

describe('searchBANAddresses()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchJSONMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(`retourne [] sans appel réseau si la requête est plus courte que ${BAN_MIN_QUERY_LENGTH} caractères`, async () => {
    const query = 'a'.repeat(BAN_MIN_QUERY_LENGTH - 1);
    const result = await searchBANAddresses({ query });
    expect(result).toEqual([]);
    expect(fetchJSONMock).not.toHaveBeenCalled();
  });

  it('retourne les résultats au premier essai sans retry', async () => {
    const feature = makeFeature();
    const response = makeBanResponse([feature]);
    fetchJSONMock.mockResolvedValueOnce(response);

    const result = await searchBANAddresses({ query: 'paris' });

    expect(fetchJSONMock).toHaveBeenCalledOnce();
    expect(result).toEqual([feature]);
  });

  it('retry après un échec et réussit au 2e essai', async () => {
    const feature = makeFeature();
    const response = makeBanResponse([feature]);
    fetchJSONMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce(response);

    const promise = searchBANAddresses({ query: 'paris' });

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(fetchJSONMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual([feature]);
  });

  it('retry 2 fois puis réussit au 3e essai', async () => {
    const response = makeBanResponse([]);
    fetchJSONMock.mockRejectedValueOnce(new Error('error 1')).mockRejectedValueOnce(new Error('error 2')).mockResolvedValueOnce(response);

    const promise = searchBANAddresses({ query: 'test' });

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(fetchJSONMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual([]);
  });

  it('échoue après avoir épuisé tous les retries', async () => {
    // MAX_RETRIES = 3 : 1 essai initial + 3 retries = 4 appels au total
    fetchJSONMock
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockRejectedValueOnce(new Error('error 3'))
      .mockRejectedValueOnce(new Error('persistent error'));

    const promise = searchBANAddresses({ query: 'test' });

    // Register rejection handler BEFORE flushing timers to avoid unhandled rejection
    const assertion = expect(promise).rejects.toThrow('persistent error');
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchJSONMock).toHaveBeenCalledTimes(4);
  });

  it('ne retry pas sur une AbortError', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    fetchJSONMock.mockRejectedValueOnce(abortError);

    // No timers involved: AbortError exits immediately
    await expect(searchBANAddresses({ query: 'test', signal: new AbortController().signal })).rejects.toThrow('The operation was aborted.');
    expect(fetchJSONMock).toHaveBeenCalledOnce();
  });

  it('arrête le retry si le signal est aborted pendant le délai', async () => {
    fetchJSONMock.mockRejectedValueOnce(new Error('network error'));

    const controller = new AbortController();
    const promise = searchBANAddresses({ query: 'test', signal: controller.signal });

    // Register rejection handler before any timer advancement
    const assertion = expect(promise).rejects.toThrow('The operation was aborted.');

    // Flush microtasks so the first rejection processes and setTimeout(300ms) starts
    await vi.advanceTimersByTimeAsync(0);

    // Abort during the retry delay
    controller.abort();

    // Advance past the retry delay — setTimeout fires but abort check triggers
    await vi.advanceTimersByTimeAsync(300);

    await assertion;
    expect(fetchJSONMock).toHaveBeenCalledOnce();
  });

  it('applique un backoff exponentiel (300ms, 600ms)', async () => {
    const response = makeBanResponse([]);
    fetchJSONMock.mockRejectedValueOnce(new Error('error 1')).mockRejectedValueOnce(new Error('error 2')).mockResolvedValueOnce(response);

    const promise = searchBANAddresses({ query: 'test' });

    // Flush microtasks: first fetchJSON rejects, catch sets up setTimeout(300ms)
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchJSONMock).toHaveBeenCalledTimes(1);

    // After 299ms: still waiting for first retry
    await vi.advanceTimersByTimeAsync(299);
    expect(fetchJSONMock).toHaveBeenCalledTimes(1);

    // At 300ms: first retry fires, rejects, sets up setTimeout(600ms)
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchJSONMock).toHaveBeenCalledTimes(2);

    // After 599ms more: still waiting for second retry
    await vi.advanceTimersByTimeAsync(599);
    expect(fetchJSONMock).toHaveBeenCalledTimes(2);

    // At 600ms: second retry fires and succeeds
    await vi.advanceTimersByTimeAsync(1);
    const result = await promise;

    expect(fetchJSONMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual([]);
  });
});
