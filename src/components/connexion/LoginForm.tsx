import Link from 'next/link';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import { useAuthentication, useRedirectionAfterLogin } from '@/modules/auth/client/hooks';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';

const zLoginForm = z.object({
  email: z.email('Veuillez entrer une adresse email valide'),
  password: z.string().min(1, 'Veuillez saisir votre mot de passe'),
});

export type LoginFormProps = {
  callbackUrl: string;
};

/**
 * Credentials login form (email + password), redirects after a successful sign-in.
 */
export function LoginForm({ callbackUrl }: LoginFormProps) {
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
