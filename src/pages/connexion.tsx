import { type GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';

import { LoginForm, type LoginFormProps } from '@/components/connexion/LoginForm';
import SimplePage from '@/components/shared/page/SimplePage';
import { nextAuthOptions } from '@/pages/api/auth/[...nextauth]';

export default function ConnectionPage(props: LoginFormProps): JSX.Element {
  return (
    <SimplePage title="Espace gestionnaire" description="Connectez-vous à votre compte France Chaleur Urbaine.">
      <LoginForm {...props} />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps<LoginFormProps> = async (context) => {
  const userSession = await getServerSession(context.req, context.res, nextAuthOptions);

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
