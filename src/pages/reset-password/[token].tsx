import { useRouter } from 'next/router';

import NewPasswordForm from '@components/connexion/NewPasswordForm';
import SimplePage from '@components/shared/page/SimplePage';

export default function ResetPasswordPage(): JSX.Element {
  const { query } = useRouter();
  return (
    <SimplePage title="Réinitialisation du mot de passe" noIndex>
      <NewPasswordForm token={query.token as string} />
    </SimplePage>
  );
}
