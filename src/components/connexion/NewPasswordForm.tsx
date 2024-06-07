import { Button, TextInput } from '@dataesr/react-dsfr';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { Container, PasswordAlert } from './Form.styles';

const NewPasswordForm = ({ token }: { token: string }) => {
  const { passwordService } = useServices();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [fail, setFail] = useState('');

  useEffect(() => {
    setError('');
    if (confirmation && confirmation !== password) {
      setError('Les mots de passe sont différents.');
    }
    if (
      password &&
      (password.length < 8 ||
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password))
    ) {
      setError(
        'Votre mot de passe doit avoir au moins 8 caractères dont 1 majuscule, 1 minuscule et 1 chiffre.'
      );
    }
  }, [password, confirmation]);
  const reset = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!error) {
      setFail('');
      passwordService
        .changePassword(token, password)
        .then(() => router.push('/connexion'))
        .catch((e) =>
          setFail(
            e.response.data.error?.issues?.[0]?.message ??
              e.response.data.message
          )
        );
    }
  };
  return (
    <Container onSubmit={reset}>
      <TextInput
        required
        type="password"
        label="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextInput
        required
        type="password"
        label="Confirmer"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
      />
      {error && <PasswordAlert type="error" title={error} />}
      {fail && <PasswordAlert type="error" title={fail} />}
      <Button submit>Changer mon mot de passe</Button>
    </Container>
  );
};

export default NewPasswordForm;
