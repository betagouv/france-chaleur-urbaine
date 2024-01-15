import { Button, Icon, TextInput } from '@dataesr/react-dsfr';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  Container,
  Password,
  PasswordIcon,
  PasswordInput,
} from './Form.styles';

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
      <TextInput
        label="Email"
        placeholder="Saisir votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <PasswordInput>
        <TextInput
          type={seePassword ? 'text' : 'password'}
          label="Mot de passe"
          placeholder="Saisir votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="password"
        />
        <PasswordIcon onClick={() => setSeePassword(!seePassword)}>
          <Icon
            name={seePassword ? 'ri-eye-line' : 'ri-eye-off-line'}
            size="lg"
          />
        </PasswordIcon>
      </PasswordInput>
      <Password>
        <Link href="/reset-password">Mot de passe oublié ?</Link>
      </Password>
      <Button submit>Me connecter</Button>
    </Container>
  );
};
