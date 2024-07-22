import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { FormEvent, useState } from 'react';

import Input from '@components/form/Input';
import { useServices } from 'src/services';

import { Container } from './Form.styles';

const ResetPasswordForm = () => {
  const { passwordService } = useServices();

  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const reset = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);
    passwordService.resetPassword(email).then(() => setSuccess(true));
  };

  return (
    <Container onSubmit={reset} fullWidth={success}>
      {success ? (
        <Alert
          severity="success"
          title={
            <>
              Un email pour réinitialiser votre mot de passe vous a été envoyé, pensez à vérifier vos spams. Si vous ne recevez pas de mail
              de réinitialisation, merci de nous contacter :{' '}
              <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr" target="_blank" rel="noopener noreferrer">
                france-chaleur-urbaine@developpement-durable.gouv.fr
              </a>
              .
            </>
          }
        />
      ) : (
        <>
          <Input
            label="Votre email :"
            nativeInputProps={{
              required: true,
              type: 'email',
              value: email,
              onChange: (e) => setEmail(e.target.value),
            }}
          />
          <Button type="submit">Réinitialiser</Button>
        </>
      )}
    </Container>
  );
};

export default ResetPasswordForm;
