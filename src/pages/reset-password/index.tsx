import ResetPasswordForm from '@components/connexion/ResetPasswordForm';
import SimplePage from '@components/shared/page/SimplePage';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export default function ResetPasswordPage(): JSX.Element {
  return (
    <SimplePage title="Oubli de mot de passe - France Chaleur Urbaine">
      <ResetPasswordForm />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userSession = await getSession(context);

  if (userSession) {
    return { redirect: { destination: '/gestionnaire', permanent: false } };
  }

  return {
    props: {},
  };
};
