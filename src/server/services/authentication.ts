import { type GetServerSidePropsContext } from 'next';
import { type Session } from 'next-auth';
import { getServerSession as getNextAuthServerSession } from 'next-auth/next';

import { nextAuthOptions } from '@/pages/api/auth/[...nextauth]';
import { deepCloneJSON } from '@/utils/objects';

export { type Session };

type ServerSessionContext = {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
};

export const getServerSession = async ({ req, res }: ServerSessionContext) => {
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
export const withServerSession = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context);

  return {
    props: {
      session: deepCloneJSON(session),
    },
  };
};
