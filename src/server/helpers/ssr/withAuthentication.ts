import { type GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

import { type UserRole } from '@/types/enum/UserRole';

export const withAuthentication = (role?: UserRole): GetServerSideProps => {
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

    if (role && userSession.user.role !== role) {
      return {
        redirect: {
          destination: '/tableau-de-bord',
          permanent: false,
        },
      };
    }

    return { props: {} };
  };
};
