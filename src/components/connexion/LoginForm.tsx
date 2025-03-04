import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import PasswordInput from '@/components/form/dsfr/PasswordInput';
import Button from '@/components/ui/Button';
import { useAuthentication } from '@/services/authentication';

import { Container } from './Form.styles';

export interface LoginFormProps {
  callbackUrl: string;
}
export const LoginForm = ({ callbackUrl }: LoginFormProps) => {
  const { signIn } = useAuthentication();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const connect = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn('credentials', {
        callbackUrl,
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
      <PasswordInput
        label="Mot de passe"
        nativeInputProps={{
          required: true,
          autoComplete: 'password',
          value: password,
          onChange: (e) => setPassword(e.target.value),
        }}
      />
      <div className="flex justify-between flex-row-reverse text-sm mb-8">
        <Link href="/reset-password">Mot de passe oublié ?</Link>
        {process.env.INSCRIPTIONS_ENABLE && (
          <Link href={`/inscription?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Créer un compte</Link>
        )}
      </div>
      <Button type="submit" loading={loading}>
        Me connecter
      </Button>
    </Container>
  );
};
