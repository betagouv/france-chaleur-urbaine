import { type GetServerSideProps } from 'next';
import { type Session, type User } from 'next-auth';
import { getSession } from 'next-auth/react';

import { type UserRole } from '@/types/enum/UserRole';

export const withAuthentication = (requiredRole?: UserRole): GetServerSideProps<AuthSSRPageProps> => {
  return async (context) => {
    const userSession = await getSession(context);

    if (!userSession) {
      return {
        redirect: {
          destination: `/connexion?notify=error:${encodeURIComponent('Vous devez être connecté pour accéder à cette page')}`,
          permanent: false,
        },
      };
    }

    if (requiredRole && !userSession.user.roles.some((role) => role === requiredRole)) {
      return {
        redirect: {
          destination: `/tableau-de-bord?notify=error:${encodeURIComponent("Vous n'avez pas les permissions suffisantes pour accéder à cette page")}`,
          permanent: false,
        },
      };
    }

    return { props: { session: userSession, user: userSession.user } };
  };
};

export type AuthSSRPageProps = {
  session: Session;
  user: User;
};
