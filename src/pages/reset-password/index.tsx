import ResetPasswordForm from '@components/connexion/ResetPasswordForm';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export default function ResetPasswordPage(): JSX.Element {
  return <ResetPasswordForm />;
}

export const getServerSideProps: GetServerSideProps<{}> = async (context) => {
  const userSession = await getSession(context);

  if (userSession) {
    return { redirect: { destination: '/gestionnaire', permanent: false } };
  }

  return {
    props: {},
  };
};
