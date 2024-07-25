import { Button } from '@codegouvfr/react-dsfr/Button';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';

import Input from '@components/form/dsfr/Input';

import { Container, Password, PasswordIcon, PasswordInput } from './Form.styles';

export interface LoginFormProps {
  callbackUrl: string;
}
export const LoginForm = ({ callbackUrl }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seePassword, setSeePassword] = useState(false);

  const connect = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signIn('credentials', {
      callbackUrl,
      email,
      password,
    });
  };

  return (
    <Container onSubmit={connect}>
      <Input
        label="Email"
        nativeInputProps={{
          required: true,
          placeholder: 'Saisir votre email',
          autoComplete: 'email',
          value: email,
          onChange: (e) => setEmail(e.target.value),
        }}
      />
      <PasswordInput>
        <Input
          label="Mot de passe"
          nativeInputProps={{
            required: true,
            type: seePassword ? 'text' : 'password',
            placeholder: 'Saisir votre mot de passe',
            autoComplete: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
          }}
        />
        <PasswordIcon onClick={() => setSeePassword(!seePassword)}>
          <span className={seePassword ? 'ri-eye-line' : 'ri-eye-off-line'} />
        </PasswordIcon>
      </PasswordInput>
      <Password>
        <Link href="/reset-password">Mot de passe oublié ?</Link>
      </Password>
      <Button type="submit">Me connecter</Button>
    </Container>
  );
};
