import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { type FormEvent, useState } from 'react';

import Button from '@/components/ui/Button';
import { submitToAirtable } from '@/services/airtable';
import { Airtable } from '@/types/enum/Airtable';

import { Container, Email } from './Newsletter.styles';

const Newsletter = () => {
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const addToNewsletter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    submitToAirtable({ Email: email }, Airtable.NEWSLETTER).then(() => setSent(true));
  };

  return (
    <Container onSubmit={addToNewsletter}>
      {sent ? (
        <Alert severity="success" title="Vous recevrez désormais notre newsletter. Pensez à vérifier vos spams." />
      ) : (
        <>
          <Email
            label="Email"
            hideLabel
            nativeInputProps={{
              type: 'email',
              required: true,
              placeholder: 'Paris@villedeparis.fr',
              value: email,
              onChange: (e) => setEmail(e.target.value),
            }}
          />
          <Button type="submit" priority="primary" loading={sending}>
            S'inscrire
          </Button>
        </>
      )}
    </Container>
  );
};

export default Newsletter;
