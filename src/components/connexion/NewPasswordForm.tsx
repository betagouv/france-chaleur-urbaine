import { useRouter } from 'next/router';
import { z } from 'zod';

import CenterLayout from '@/components/shared/page/CenterLayout';
import Heading from '@/components/ui/Heading';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

const zNewPasswordForm = z
  .object({
    confirmation: z.string(),
    password: z
      .string()
      .min(8, 'Votre mot de passe doit avoir au moins 8 caractères')
      .regex(/[a-z]/, 'Votre mot de passe doit contenir au moins une lettre minuscule')
      .regex(/[A-Z]/, 'Votre mot de passe doit contenir au moins une lettre majuscule')
      .regex(/[0-9]/, 'Votre mot de passe doit contenir au moins un chiffre'),
  })
  .refine((data) => data.password === data.confirmation, {
    error: 'Les mots de passe sont différents',
    path: ['confirmation'],
  });

type NewPasswordFormProps = {
  token: string;
};

/**
 * New password form, reached from the reset link: sets the password tied to the token.
 */
const NewPasswordForm = ({ token }: NewPasswordFormProps) => {
  const { mutateAsync: changePassword } = trpc.auth.changePassword.useMutation();
  const router = useRouter();

  const form = useAppForm({
    ...schemaValidation(zNewPasswordForm),
    defaultValues: { confirmation: '', password: '' },
    onSubmit: toastErrors(async ({ value }) => {
      await changePassword({ password: value.password, token });
      void router.push(
        `/connexion?notify=success:${encodeURIComponent('Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.')}`
      );
    }),
  });

  return (
    <CenterLayout maxWidth="500px">
      <Heading as="h1" size="h2" color="blue-france">
        Réinitialisation du mot de passe
      </Heading>
      <Form form={form} className="flex flex-col gap-4">
        <form.AppField name="password">
          {(field) => <field.PasswordField label="Mot de passe" nativeInputProps={{ autoComplete: 'new-password' }} />}
        </form.AppField>
        <form.AppField name="confirmation">
          {(field) => <field.PasswordField label="Confirmer" nativeInputProps={{ autoComplete: 'new-password' }} />}
        </form.AppField>
        <form.SubmitButton>Changer mon mot de passe</form.SubmitButton>
      </Form>
    </CenterLayout>
  );
};

export default NewPasswordForm;
