import { type AuthConfig, type Context, t } from './context';
import { createAuthMiddleware } from './middlewares/auth';
import { createLoggingMiddleware } from './middlewares/logging';

// Create middleware instances
const loggingMiddleware = createLoggingMiddleware(t);
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

export const route = createProcedureWithAuth(t.procedure.use(loggingMiddleware).use(authMiddleware));
export const routeRole = (roles: Context['user']['role'][]) => route.meta({ auth: { roles } });
