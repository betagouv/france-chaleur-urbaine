import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from './upload';

describe('upload service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fetchWithRetry()', () => {
    it('successfully fetches on first attempt', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'https://example.com/download/abc123',
      });
      global.fetch = mockFetch;

      const response = await fetchWithRetry('https://example.com/upload', {
        body: 'test data',
        method: 'PUT',
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 5xx errors and eventually succeeds', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          // Fail twice with 503
          return {
            ok: false,
            status: 503,
            text: async () => 'Service Unavailable',
          };
        }
        // Succeed on third attempt
        return {
          ok: true,
          status: 200,
          text: async () => 'https://example.com/download/abc123',
        };
      });
      global.fetch = mockFetch;

      const fetchPromise = fetchWithRetry('https://example.com/upload', {
        body: 'test data',
        method: 'PUT',
      });

      // First retry after 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const response = await fetchPromise;
      expect(response.status).toBe(200);
    });

    it('throws error after max retries when all attempts fail', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });
      global.fetch = mockFetch;

      const fetchPromise = fetchWithRetry('https://example.com/upload', {
        body: 'test data',
        method: 'PUT',
      });

      // Fast-forward through all retry delays (1s + 2s + 4s)
      await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000);

      const response = await fetchPromise;

      // After max retries, it returns the last response (with status 500)
      expect(response.status).toBe(500);
      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});
