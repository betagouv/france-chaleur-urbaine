import { TRPCError } from '@trpc/server';
import type { User } from 'next-auth';
import { vi } from 'vitest';

import type { Context } from '@/modules/trpc/server/context';

export { TRPCError };

import { appRouter } from '@/modules/trpc/trpc.config';
import { parentLogger } from '@/server/helpers/logger';
import type { UserRole } from '@/types/enum/UserRole';

import { uuid } from './helpers';

/**
 * Creates a mock tRPC context for testing
 */
export function createMockContext(user: Partial<User> | null = null): Context {
  const mockReq = {
    headers: {},
    query: {},
    session: user ? { expires: new Date(Date.now() + 86400000).toISOString(), user } : null,
    socket: { remoteAddress: '127.0.0.1' },
    user: user as User | undefined,
  } as any;

  const mockRes = {
    getHeader: vi.fn(),
    setHeader: vi.fn(),
  } as any;

  return {
    hasRole: (role: UserRole) => user?.role === role,
    headers: mockReq.headers,
    logger: parentLogger.child({}),
    query: mockReq.query,
    req: mockReq,
    res: mockRes,
    session: mockReq.session,
    user: user as User | undefined,
    userId: user?.id,
  };
}

/**
 * Creates a tRPC caller with a specific user context
 */
export function createTestCaller(user: Partial<User> | null = null) {
  const ctx = createMockContext(user);
  return appRouter.createCaller(ctx);
}

/**
 * Pre-configured test users with different roles
 */
export const testUsers = {
  admin: {
    email: `admin-${uuid(100)}@test.local`,
    id: uuid(100),
    role: 'admin' as const,
  },
  gestionnaire: {
    email: `gestionnaire-${uuid(101)}@test.local`,
    gestionnaires: ['7501C'],
    id: uuid(101),
    role: 'gestionnaire' as const,
  },
  particulier: {
    email: `particulier-${uuid(102)}@test.local`,
    id: uuid(102),
    role: 'particulier' as const,
  },
  professionnel: {
    email: `professionnel-${uuid(103)}@test.local`,
    id: uuid(103),
    role: 'professionnel' as const,
  },
} satisfies Record<string, Partial<User>>;
