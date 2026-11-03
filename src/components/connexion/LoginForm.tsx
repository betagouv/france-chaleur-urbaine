import { z } from 'zod';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { useAuthentication, useRedirectionAfterLogin } from '@/modules/auth/client/hooks';
import { DEMAND_TRACKING_PAGE_PATH } from '@/modules/demand-tracking/constants';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';

const zLoginForm = z.object({
  email: z.email('Veuillez entrer une adresse email valide'),
  password: z.string().min(1, 'Veuillez saisir votre mot de passe'),
});

export type LoginFormProps = {
  callbackUrl: string;
  /** The previous sign-in attempt failed: remind that demands no longer need an account. */
  hasLoginError?: boolean;
};

/**
 * Credentials login form (email + password), redirects after a successful sign-in.
 */
export function LoginForm({ callbackUrl, hasLoginError = false }: LoginFormProps) {
  const { signIn, session } = useAuthentication();
  useRedirectionAfterLogin(session);

  const form = useAppForm({
    ...schemaValidation(zLoginForm),
    defaultValues: { email: '', password: '' },
    onSubmit: toastErrors(async ({ value }) => {
      await signIn('credentials', {
        callbackUrl,
        email: value.email,
        password: value.password,
      });
    }),
  });

  return (
    <Form form={form}>
      {hasLoginError && (
        <Alert variant="info" size="sm" className="mb-4">
          Vous avez déposé une demande ? Plus besoin de compte pour la suivre :{' '}
          <Link href={DEMAND_TRACKING_PAGE_PATH}>Où en est ma demande ?</Link>
        </Alert>
      )}
      <form.AppField name="email">
        {(field) => <field.EmailField label="Email" nativeInputProps={{ placeholder: 'Saisir votre email' }} />}
      </form.AppField>
      <form.AppField name="password">{(field) => <field.PasswordField label="Mot de passe" />}</form.AppField>
      <div className="flex justify-between flex-row-reverse text-sm mb-8">
        <Link href="/reset-password">Mot de passe oublié ?</Link>
      </div>
      <div className="flex justify-between text-sm mb-8 items-center">
        <Button priority="tertiary" href="/inscription">
          Créer un compte
        </Button>
        <form.SubmitButton>Me connecter</form.SubmitButton>
      </div>
    </Form>
  );
}
