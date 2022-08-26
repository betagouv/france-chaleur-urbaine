import { Alert, Button, TextInput } from '@dataesr/react-dsfr';
import { FormEvent, useState } from 'react';
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
    <Container onSubmit={reset}>
      {success ? (
        <Alert
          type="success"
          title="Un email pour renvoyer votre mot de passe vous a été envoyer, pensez à regarder vos spams."
        />
      ) : (
        <>
          <TextInput
            required
            label="Votre email:"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button submit>Réinitialiser</Button>
        </>
      )}
    </Container>
  );
};

export default ResetPasswordForm;
