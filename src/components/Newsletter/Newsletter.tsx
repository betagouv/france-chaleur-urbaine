import { Alert, Button } from '@dataesr/react-dsfr';
import { submitToAirtable } from '@helpers/airtable';
import { FormEvent, useState } from 'react';
import { Oval } from 'react-loader-spinner';
import { Container, Email } from './Newsletter.styles';

const Newsletter = () => {
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const addToNewsletter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    submitToAirtable({ Email: email }, 'FCU - Newsletter').then(() =>
      setSent(true)
    );
  };

  return (
    <Container onSubmit={addToNewsletter}>
      {sent ? (
        <Alert
          type="success"
          title="Vous recevrez desormais notre newsletter. Pensez à verifier vos spams."
        />
      ) : (
        <>
          <Email
            type="email"
            placeholder="Paris@villedeparis.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {sending ? (
            <Oval height={40} width={40} />
          ) : (
            <Button secondary submit>
              S'inscrire
            </Button>
          )}
        </>
      )}
    </Container>
  );
};

export default Newsletter;
