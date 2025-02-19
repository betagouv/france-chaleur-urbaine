import { type GetServerSideProps } from 'next';
import { getSession } from '@/server/services/session';

import ResetPasswordForm from '@/components/connexion/ResetPasswordForm';
import SimplePage from '@/components/shared/page/SimplePage';

export default function ResetPasswordPage(): JSX.Element {
  return (
    <SimplePage title="Oubli de mot de passe" description="Réinitialisez le mot de passe de votre compte sur France Chaleur Urbaine.">
      <ResetPasswordForm />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userSession = await getSession(context);

  if (userSession) {
    return { redirect: { destination: '/tableau-de-bord', permanent: false } };
  }

  return {
    props: {},
  };
};
