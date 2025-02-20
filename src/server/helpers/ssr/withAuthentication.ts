import { type GetServerSideProps } from 'next';
import { getServerSession, type Session } from 'next-auth';

import { nextAuthOptions } from '@/pages/api/auth/[...nextauth]';
import { type UserRole } from '@/types/enum/UserRole';
import { deepCloneJSON } from '@/utils/objects';

export const withAuthentication = (requiredRole?: UserRole): GetServerSideProps<AuthSSRPageProps> => {
  return async (context) => {
    const userSession = await getServerSession(context.req, context.res, nextAuthOptions);

    if (!userSession) {
      return {
        redirect: {
          destination: `/connexion?notify=error:${encodeURIComponent('Vous devez être connecté pour accéder à cette page')}`,
          permanent: false,
        },
      };
    }

    if (requiredRole && userSession.user.role !== requiredRole) {
      return {
        redirect: {
          // on pourra avoir une URL style / ou /tableau-de-bord quand tous les types de comptes seront créés
          destination: '/gestionnaire',
          permanent: false,
        },
      };
    }

    return { props: { session: deepCloneJSON(userSession) } };
  };
};

export type AuthSSRPageProps = {
  session: Session;
};
