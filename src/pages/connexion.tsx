import { type GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

import { LoginForm, type LoginFormProps } from '@/components/connexion/LoginForm';
import SimplePage from '@/components/shared/page/SimplePage';

export default function ConnectionPage(props: LoginFormProps): JSX.Element {
  return (
    <SimplePage title="Espace gestionnaire" description="Connectez-vous à votre compte France Chaleur Urbaine.">
      <LoginForm {...props} />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps<LoginFormProps> = async (context) => {
  const userSession = await getSession(context);

  if (userSession) {
    return {
      redirect: {
        destination: '/tableau-de-bord',
        permanent: false,
      },
    };
  }

  return {
    props: {
      callbackUrl: (context.query.callbackUrl as string) || '/tableau-de-bord',
    },
  };
};
