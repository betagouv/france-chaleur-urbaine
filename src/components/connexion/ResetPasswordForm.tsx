import React from 'react';
import { z } from 'zod';

import { clientConfig } from '@/client-config';
import useForm from '@/components/form/react-form/useForm';
import CenterLayout from '@/components/shared/page/CenterLayout';
import Alert from '@/components/ui/Alert';
import Heading from '@/components/ui/Heading';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

const resetPasswordSchema = z.object({
  email: z.string().email('Veuillez entrer une adresse email valide'),
});

const ResetPasswordForm = () => {
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();
  const [success, setSuccess] = React.useState(false);

  const { Form, EmailInput, Submit } = useForm({
    onSubmit: toastErrors(async ({ value }) => {
      await resetPasswordMutation.mutateAsync({ email: value.email });
      setSuccess(true);
    }),
    schema: resetPasswordSchema,
  });

  if (success) {
    return (
      <Alert variant="success" className="max-w-lg mx-auto my-12">
        Un email pour réinitialiser votre mot de passe vous a été envoyé, pensez à vérifier vos spams. Si vous ne recevez pas de mail de
        réinitialisation, merci de nous contacter :{' '}
        <a href={`mailto:${clientConfig.contactEmail}`} target="_blank" rel="noopener noreferrer">
          {clientConfig.contactEmail}
        </a>
        .
      </Alert>
    );
  }

  return (
    <CenterLayout maxWidth="500px">
      <Heading as="h1" size="h2">
        Réinitialisation du mot de passe
      </Heading>
      <Form>
        <EmailInput name="email" label="Votre email :" />
        <Submit>Réinitialiser</Submit>
      </Form>
    </CenterLayout>
  );
};

export default ResetPasswordForm;
