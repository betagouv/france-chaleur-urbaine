import React from 'react';
import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import CenterLayout from '@/components/shared/page/CenterLayout';
import Alert from '@/components/ui/Alert';
import Heading from '@/components/ui/Heading';
import { useServices } from '@/services';
import { toastErrors } from '@/services/notification';
const resetPasswordSchema = z.object({
  email: z.string().email('Veuillez entrer une adresse email valide'),
});

const ResetPasswordForm = () => {
  const { passwordService } = useServices();
  const [success, setSuccess] = React.useState(false);

  const { Form, EmailInput, Submit } = useForm({
    schema: resetPasswordSchema,
    onSubmit: toastErrors(async ({ value }) => {
      await passwordService.resetPassword(value.email);
      setSuccess(true);
    }),
  });

  if (success) {
    return (
      <Alert variant="success" className="max-w-lg mx-auto my-12">
        Un email pour réinitialiser votre mot de passe vous a été envoyé, pensez à vérifier vos spams. Si vous ne recevez pas de mail de
        réinitialisation, merci de nous contacter :{' '}
        <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr" target="_blank" rel="noopener noreferrer">
          france-chaleur-urbaine@developpement-durable.gouv.fr
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
