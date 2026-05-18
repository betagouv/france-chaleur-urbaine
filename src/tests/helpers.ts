import type { User } from 'next-auth';

import { mockGetServerSession } from './setup-mocks';

/**
 * Convert a number to a valid v4 UUID for tests.
 *
 * Format: 00000000-0000-4000-8000-00000000NNNN
 * The version nibble (4) and variant nibble (8) satisfy RFC 4122 / Zod z.uuidv4().
 *
 * Note: the number must be <= 999999999999
 */
export function uuid(i: number): string {
  return `00000000-0000-4000-8000-${`${i}`.padStart(12, '0')}`;
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
