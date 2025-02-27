import { type GetServerSidePropsResult, type GetServerSideProps, type GetServerSidePropsContext } from 'next';
import { type Session } from 'next-auth';
import { getServerSession as getNextAuthServerSession } from 'next-auth/next';

import { nextAuthOptions } from '@/pages/api/auth/[...nextauth]';
import { type UserRole } from '@/types/enum/UserRole';
import { deepMergeObjects } from '@/utils/core';
import { deepCloneJSON } from '@/utils/objects';

export { type Session };

type ServerSessionContext = {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
};
/**
 * Get the session from the server.
 * If using getServerSideProps, use withServerSession instead.
 */
export const getServerSession = async ({ req, res }: Pick<ServerSessionContext, 'req' | 'res'>) => {
  return getNextAuthServerSession(req, res, nextAuthOptions) as Promise<Session>;
};

/**
 * Retrieve the session from the server and pass it to the page props
 * This is to prevent session reloading on the frontend
 *
 * Usage:
 * export const getServerSideProps = withServerSession;
 *
 * Or:
 * import { withServerSession, type Session } from '@/server/services/authentication';
 * export const getServerSideProps: GetServerSideProps<{ session: Session }> = async (context: GetServerSidePropsContext) => {
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
 */
export const withAuthentication = (requiredRole?: UserRole, handler?: WithServerSessionProps): GetServerSideProps<AuthSSRPageProps> => {
  return withServerSession(async ({ context, session }) => {
    if (!session) {
      return {
        redirect: {
          destination: `/connexion?callbackUrl=${encodeURIComponent(context.resolvedUrl)}&notify=error:${encodeURIComponent('Vous devez être connecté pour accéder à cette page')}`,
          permanent: false,
        },
      };
    }

    if (requiredRole && session.user.role !== requiredRole) {
      return {
        redirect: {
          destination: `/tableau-de-bord?notify=error:${encodeURIComponent("Vous n'avez pas les permissions suffisantes pour accéder à cette page")}`,
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
