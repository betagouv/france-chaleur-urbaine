import { useRouter } from 'next/router';

import NewPasswordForm from '@/components/connexion/NewPasswordForm';
import SimplePage from '@/components/shared/page/SimplePage';

function ResetPasswordPage() {
  const { query } = useRouter();
  return (
    <SimplePage title="Réinitialisation du mot de passe" noIndex>
      <NewPasswordForm token={query.token as string} />
    </SimplePage>
  );
}

export default ResetPasswordPage;
