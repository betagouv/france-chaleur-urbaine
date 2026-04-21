import { userRoles, userRolesWithPermissions } from '@/types/enum/UserRole';

import { type AuthConfig, type Context, t } from './context';
import { createAuthMiddleware } from './middlewares/auth';
import { createLoggingMiddleware } from './middlewares/logging';
import { createRateLimitMiddleware } from './middlewares/rate-limit';

// Create middleware instances
const loggingMiddleware = createLoggingMiddleware(t);
const rateLimitMiddleware = createRateLimitMiddleware(t);
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

export const route = createProcedureWithAuth(t.procedure.use(loggingMiddleware).use(rateLimitMiddleware).use(authMiddleware));
export const routeRole = (roles: Context['user']['role'][]) => route.meta({ auth: { roles } });
export const routeAuthenticated = route.meta({ auth: { authenticated: true } });

/**
 * Procédures pré-configurées par groupe de rôles — à utiliser systématiquement plutôt que `routeRole([...])` inline.
 *
 * - `adminRoute` : admin uniquement.
 * - `demandAccessRoute` : admin + rôles avec permissions territoriales (gestionnaire, collectivite, alec).
 * - `authRoute` : tout utilisateur authentifié (tous les rôles).
 */
export const adminRoute = routeRole(['admin']);
export const demandAccessRoute = routeRole(['admin', ...userRolesWithPermissions]);
export const authRoute = routeRole([...userRoles]);
