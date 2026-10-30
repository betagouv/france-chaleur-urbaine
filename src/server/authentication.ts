import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import type { Session } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { getServerSession as getNextAuthServerSession } from 'next-auth/next';

import { nextAuthOptions } from '@/pages/api/auth/[...nextauth]';
import type { UserRole } from '@/types/enum/UserRole';
import { deepMergeObjects } from '@/utils/core';
import { deepCloneJSON } from '@/utils/objects';

export type { Session };

type ServerSessionContext = {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
};
/**
 * Get the session from the server.
 * If using getServerSideProps, use withServerSession instead.
 * A deactivated (or deleted) account gets no session, even with a still-valid JWT: every server-side
 * entry point (tRPC context, REST routes, page guards) goes through this function.
 */
export const getServerSession = async ({ req, res }: Pick<ServerSessionContext, 'req' | 'res'>) => {
  const session = await getRawServerSession({ req, res });
  return (session?.user?.active ? session : null) as Session;
};

/**
 * Id of the account whose password was accepted but whose admin second factor is missing or expired, `null` otherwise.
 * Such a session exposes no user (see the NextAuth session callback): the person has to go through `/connexion/verification`.
 */
export const getPendingMfaUserId = async ({ req, res }: Pick<ServerSessionContext, 'req' | 'res'>): Promise<string | null> => {
  const session = await getRawServerSession({ req, res });
  if (session?.mfaPending !== true) {
    return null;
  }
  const token = await getToken({ req });
  return token?.sub ?? null;
};

const getRawServerSession = async ({ req, res }: Pick<ServerSessionContext, 'req' | 'res'>) =>
  (await getNextAuthServerSession(req, res, nextAuthOptions)) as Session | null;

/**
 * Retrieve the session from the server and pass it to the page props
 * This is to prevent session reloading on the frontend
 *
 * Usage:
 * export const getServerSideProps = withServerSession;
 *
 * Or:
 * import { withServerSession, type Session } from '@/modules/auth/server/serviceentication';
 * export const getServerSideProps<{ session: Session }> = async (context: GetServerSidePropsContext) => {
 *   const { props } = await withServerSession(context);
 *
 *   return {
 *     props: {
 *       session: props.session,
 *       somethingelse: 'indeed',
 *     },
 *   };
 * };
 */
type WithServerSessionProps = (ctx: {
  context: GetServerSidePropsContext;
  session: Session;
}) => GetServerSidePropsResult<any> | Promise<GetServerSidePropsResult<any>>;

/**
 * Add the session to the page props and provide a callback to handle any custom behavior (like redirects).
 */
export const withServerSession = (handler: WithServerSessionProps) => async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context);
  const res = await handler({ context, session });
  return 'redirect' in res
    ? res
    : deepMergeObjects(res, {
        props: {
          session: deepCloneJSON(session),
        },
      });
};

/**
 * Add authentication to a page and return the session in server side props.
 *
 * ⚠️ IMPORTANT: This function MUST ONLY be used in getServerSideProps, NEVER as a component HOC!
 *
 * ✅ CORRECT usage:
 * ```ts
 * export const getServerSideProps = withAuthentication(['particulier', 'professionnel']);
 * ```
 *
 * ❌ INCORRECT usage (will bundle server code in client):
 * ```ts
 * export default withAuthentication(['particulier'])(MyComponent);
 * ```
 */
export const withAuthentication = (requiredRoles?: UserRole[], handler?: WithServerSessionProps): GetServerSideProps<AuthSSRPageProps> => {
  return withServerSession(async ({ context, session }) => {
    if (!session) {
      const callbackUrl = encodeURIComponent(context.resolvedUrl);
      return {
        redirect: {
          destination: (await getPendingMfaUserId(context))
            ? `/connexion/verification?callbackUrl=${callbackUrl}`
            : `/connexion?callbackUrl=${callbackUrl}&notify=error:${encodeURIComponent('Vous devez être connecté pour accéder à cette page')}`,
          permanent: false,
        },
      };
    }

    if (requiredRoles && !requiredRoles.includes(session.user.role)) {
      return {
        redirect: {
          destination: `/pro/tableau-de-bord?notify=error:${encodeURIComponent("Vous n'avez pas les permissions suffisantes pour accéder à cette page")}`,
          permanent: false,
        },
      };
    }

    if (handler) {
      return await handler({ context, session });
    }

    return { props: {} };
  });
};

export type AuthSSRPageProps = {
  session: Session;
};
