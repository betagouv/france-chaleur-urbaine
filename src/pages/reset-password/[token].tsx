import NewPasswordForm from '@components/connexion/NewPasswordForm';
import { useRouter } from 'next/router';

export default function ResetPasswordPage(): JSX.Element {
  const { query } = useRouter();
  return <NewPasswordForm token={query.token as string} />;
}
