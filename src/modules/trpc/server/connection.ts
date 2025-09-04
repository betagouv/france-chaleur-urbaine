import { initTRPC } from '@trpc/server';

import { type Context } from './context';
import { type AuthConfig, createAuthMiddleware } from './middlewares/auth';

// Initialize tRPC with context
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    console.error('🔴 TRPC Error:', {
      code: error.code,
      message: error.message,
      path: (shape as any).path,
    });
    return shape;
  },
});

// Create auth middleware instance
const authMiddleware = createAuthMiddleware(t);

// Create a new procedure type that includes the auth method
type ProcedureWithAuth<T> = T & {
  auth: (config: AuthConfig) => T;
};

// Extended procedure with .auth() method
function createProcedureWithAuth<T extends ReturnType<typeof t.procedure.use>>(baseProcedure: T): ProcedureWithAuth<T> {
  return Object.assign(baseProcedure, {
    auth: (config: AuthConfig) => baseProcedure.meta({ auth: config }) as T,
  });
}

export const router = t.router;

export const publicProcedure = t.procedure;
export const authProcedure = createProcedureWithAuth(t.procedure.use(authMiddleware));
