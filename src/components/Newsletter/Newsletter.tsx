import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { type FormEvent, useState } from 'react';

import Button from '@/components/ui/Button';
import { notify } from '@/modules/notification';
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
    void submitToAirtable({ Email: email }, Airtable.NEWSLETTER)
      .then(() => setSent(true))
      .catch((error) => {
        notify('error', error.message);
        setSending(false);
      });
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
              onChange: (e) => setEmail(e.target.value),
              placeholder: 'Paris@villedeparis.fr',
              required: true,
              type: 'email',
              value: email,
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
