import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import Button from '@/components/ui/Button';
import { authClient } from '@/services/auth-client';

import { Container, Password, PasswordIcon, PasswordInput } from './Form.styles';

export interface LoginFormProps {
  callbackUrl: string;
}
export const LoginForm = ({ callbackUrl }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seePassword, setSeePassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const connect = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.signIn.email({
        callbackURL: callbackUrl,
        email,
        password,
      });
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
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
      <Button type="submit" loading={loading}>
        Me connecter
      </Button>
    </Container>
  );
};
