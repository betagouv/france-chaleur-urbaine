import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

import { LoginForm, LoginFormProps } from '@components/connexion/LoginForm';
import SimplePage from '@components/shared/page/SimplePage';

export default function ConnectionPage(props: LoginFormProps): JSX.Element {
  return (
    <SimplePage title="Connexion">
      <LoginForm {...props} />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps<LoginFormProps> = async (context) => {
  const userSession = await getSession(context);

  if (userSession) {
    return {
      redirect: {
        destination: '/gestionnaire',
        permanent: false,
      },
    };
  }

  return {
    props: {
      callbackUrl: (context.query.callbackUrl as string) || '/gestionnaire',
    },
  };
};
