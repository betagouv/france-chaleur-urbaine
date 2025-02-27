import ResetPasswordForm from '@/components/connexion/ResetPasswordForm';
import SimplePage from '@/components/shared/page/SimplePage';
import { withServerSession } from '@/server/authentication';

function ResetPasswordPage() {
  return (
    <SimplePage title="Oubli de mot de passe" description="Réinitialisez le mot de passe de votre compte sur France Chaleur Urbaine.">
      <ResetPasswordForm />
    </SimplePage>
  );
}

export const getServerSideProps = withServerSession(({ session }) => {
  if (session) {
    return {
      redirect: {
        destination: '/gestionnaire',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
});

export default ResetPasswordPage;
