import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

import { USER_ROLE } from 'src/types/enum/UserRole';

export const withPermission = (role?: `${USER_ROLE}`): GetServerSideProps => {
  return async (context) => {
    const userSession = await getSession(context);

    if (!userSession) {
      return {
        redirect: {
          destination: '/connexion',
          permanent: false,
        },
      };
    }

    if (role && userSession.user.role !== role) {
      return {
        redirect: {
          // on pourra avoir une URL style / ou /tableau-de-bord quand tous les types de comptes seront créés
          destination: '/gestionnaire',
          permanent: false,
        },
      };
    }

    return { props: {} };
  };
};
