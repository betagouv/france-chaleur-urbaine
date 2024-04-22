import NewPasswordForm from '@components/connexion/NewPasswordForm';
import SimplePage from '@components/shared/page/SimplePage';
import { useRouter } from 'next/router';

export default function ResetPasswordPage(): JSX.Element {
  const { query } = useRouter();
  return (
    <SimplePage title="Réinitialisation du mot de passe - France Chaleur Urbaine">
      <NewPasswordForm token={query.token as string} />
    </SimplePage>
  );
}
