import { type GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';

import ResetPasswordForm from '@/components/connexion/ResetPasswordForm';
import SimplePage from '@/components/shared/page/SimplePage';
import { nextAuthOptions } from '@/pages/api/auth/[...nextauth]';

export default function ResetPasswordPage(): JSX.Element {
  return (
    <SimplePage title="Oubli de mot de passe" description="Réinitialisez le mot de passe de votre compte sur France Chaleur Urbaine.">
      <ResetPasswordForm />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userSession = await getServerSession(context.req, context.res, nextAuthOptions);

  if (userSession) {
    return { redirect: { destination: '/gestionnaire', permanent: false } };
  }

  return {
    props: {},
  };
};
