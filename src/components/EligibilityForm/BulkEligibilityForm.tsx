import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { ChangeEvent, FormEvent, useState } from 'react';

import Input from '@components/form/dsfr/Input';
import { useServices } from 'src/services';

import { Container } from './BulkEligibilityForm.styles';

const BulkEligibilityForm = () => {
  const { heatNetworkService } = useServices();
  const [addresses, setAddresses] = useState<string>();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (!event.target.files || event.target.files.length === 0) {
      setAddresses('');
      return;
    }

    if (event.target.files[0].size > 1048576) {
      setError('Le fichier ne doit pas dépasser 1Mb.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const text = e.target.result as string;
        setAddresses(text);
      }
    };
    reader.readAsText(event.target.files[0]);
  };

  const checkEligibility = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addresses || addresses.length === 0) {
      return;
    }

    setIsSubmitting(true);
    heatNetworkService.bulkEligibility(addresses, email).then(() => {
      setSent(true);
      setIsSubmitting(false);
    });
  };

  return (
    <Container>
      {sent ? (
        <Alert
          severity="success"
          title="Fichier bien reçu"
          description="Le résultat vous sera envoyé par mail (pensez à vérifier vos spams)."
        />
      ) : (
        <form onSubmit={checkEligibility}>
          <Upload
            label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
            hint=""
            state={error ? 'error' : 'default'}
            stateRelatedMessage={error}
            nativeInputProps={{
              accept: '.txt, .csv',
              onChange: readFile,
            }}
          />

          <Input
            label=""
            nativeInputProps={{
              type: 'email',
              placeholder: 'Tapez ici votre email *',
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
            }}
          />
          <Button disabled={isSubmitting || !email || !addresses || !!error} type="submit">
            Tester le fichier d’adresses
          </Button>
        </form>
      )}
    </Container>
  );
};

export default BulkEligibilityForm;
