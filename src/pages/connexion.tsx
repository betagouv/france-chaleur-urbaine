import { LoginForm, type LoginFormProps } from '@/components/connexion/LoginForm';
import SimplePage from '@/components/shared/page/SimplePage';
import { withServerSession } from '@/server/authentication';

export default function ConnectionPage(props: LoginFormProps): JSX.Element {
  return (
    <SimplePage title="Espace gestionnaire" description="Connectez-vous à votre compte France Chaleur Urbaine.">
      <LoginForm {...props} />
    </SimplePage>
  );
}

export const getServerSideProps = withServerSession(({ context, session }) => {
  if (session) {
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
});
