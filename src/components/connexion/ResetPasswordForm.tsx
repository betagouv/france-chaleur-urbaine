import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

import CenterLayout from '@/components/shared/page/CenterLayout';
import Alert from '@/components/ui/Alert';
import Heading from '@/components/ui/Heading';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

const zResetPasswordForm = z.object({
  email: z.email('Veuillez entrer une adresse email valide'),
});

/**
 * Password reset request form: sends a reset link to the given email address.
 */
const ResetPasswordForm = () => {
  const { mutateAsync: requestPassword } = trpc.auth.resetPassword.useMutation();
  const [success, setSuccess] = useState(false);

  const form = useAppForm({
    ...schemaValidation(zResetPasswordForm),
    defaultValues: { email: '' },
    onSubmit: toastErrors(async ({ value }) => {
      await requestPassword({ email: value.email });
      setSuccess(true);
    }),
  });

  if (success) {
    return (
      <Alert variant="success" className="max-w-lg mx-auto my-12">
        Un email pour réinitialiser votre mot de passe vous a été envoyé, pensez à vérifier vos spams. Si vous ne recevez pas de mail de
        réinitialisation, merci de nous contacter via le <Link href="/contact">formulaire de contact</Link>.
      </Alert>
    );
  }

  return (
    <CenterLayout maxWidth="500px">
      <Heading as="h1" size="h2" color="blue-france">
        Réinitialisation du mot de passe
      </Heading>
      <Form form={form}>
        <form.AppField name="email">{(field) => <field.EmailField label="Votre email :" />}</form.AppField>
        <form.SubmitButton>Réinitialiser</form.SubmitButton>
      </Form>
    </CenterLayout>
  );
};

export default ResetPasswordForm;
