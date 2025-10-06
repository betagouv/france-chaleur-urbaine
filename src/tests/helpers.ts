import type { User } from 'next-auth';

import { mockGetServerSession } from './setup-mocks';

/**
 * Convert a number to a uuid for tests.
 *
 * Note: the number must be <= 999999999999
 */
export function uuid(i: number): string {
  return `${'00000000-0000-0000-0000-000000000000'.substr(0, 36 - `${i}`.length)}${i}`;
}

/**
 * Mock la session utilisateur pour les tests d'API
 */
export function mockUserSession(user: Partial<User> | null) {
  mockGetServerSession.mockResolvedValue(
    user
      ? {
          expires: new Date(Date.now() + 86400000).toISOString(), // 24h
          user,
        }
      : null
  );
}
