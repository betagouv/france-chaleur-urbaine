import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

/**
 * Ce module est branché avec next-auth. Il est utilisé pour récupérer la session des utilisateurs avec un cache devant la BDD.
 * Pour la mise à jour de la dernière connexion, un buffer est utilisé pour éviter de faire trop de requêtes.
 */

/**
 * Délai de mise à jour de la dernière connexion d'un utilisateur, en cas de requête API.
 */
const SESSION_LAST_CONNECTION_FLUSH_DELAY_MS = 5000;

/**
 * IDs des utilisateurs dont la dernière connexion doit être mise à jour.
 */
const pendingTouches = new Set<string>();
let flushTimeout: NodeJS.Timeout | undefined;
let isFlushing = false;

const scheduleFlush = () => {
  if (flushTimeout || pendingTouches.size === 0) {
    return;
  }

  flushTimeout = setTimeout(() => {
    flushTimeout = undefined;
    void flushPendingLastConnections();
  }, SESSION_LAST_CONNECTION_FLUSH_DELAY_MS);
};

const flushPendingLastConnections = async () => {
  if (isFlushing || pendingTouches.size === 0) {
    return;
  }

  isFlushing = true;
  const userIds = Array.from(pendingTouches);
  pendingTouches.clear();

  try {
    const now = new Date();
    await kdb.updateTable('users').set({ last_connection: now }).where('id', 'in', userIds).execute();
  } catch (error) {
    logger.error('failed to flush last_connection updates', { error });
    userIds.forEach((id) => pendingTouches.add(id));
  } finally {
    isFlushing = false;
    scheduleFlush();
  }
};

const touchUserLastConnection = (userId: string) => {
  pendingTouches.add(userId);
  scheduleFlush();
};

/**
 * Durée de validité du cache des informations d'une session utilisateur.
 */
const USER_SESSION_CACHE_TTL_MS = 60_000;

type UserSession = Awaited<ReturnType<typeof getUserInfos>>;

const userSessionCache = new Map<
  string,
  {
    expiresAt: number;
    data: UserSession;
  }
>();

/**
 * Promesses des récupérations des informations d'un utilisateur. Afin d'éviter de faire plusieurs requêtes en parallèle quand rien n'est en cache.
 */
const userSessionPendingRetrievals = new Map<string, Promise<UserSession>>();

/**
 * Récupère les informations d'un utilisateur à partir de son ID, via cache ou requête BDD.
 * @param userId
 * @returns
 */
export const getUserSession = async (userId: string) => {
  touchUserLastConnection(userId);

  const cached = userSessionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const pendingRetrieval = userSessionPendingRetrievals.get(userId);
  if (pendingRetrieval) {
    return pendingRetrieval;
  }

  const retrievalPromise = getUserInfos(userId)
    .then((user) => {
      if (user) {
        userSessionCache.set(userId, { data: user, expiresAt: Date.now() + USER_SESSION_CACHE_TTL_MS });
      } else {
        userSessionCache.delete(userId);
      }
      return user;
    })
    .finally(() => {
      userSessionPendingRetrievals.delete(userId);
    });

  userSessionPendingRetrievals.set(userId, retrievalPromise);

  return retrievalPromise;
};

const getUserInfos = (userId: string) =>
  kdb
    .selectFrom('users')
    .select(['id', 'email', 'role', 'gestionnaires', 'receive_new_demands', 'receive_old_demands', 'active', 'created_at', 'signature'])
    .where('id', '=', userId)
    .executeTakeFirst();
