import { Alert, Button, File, TextInput } from '@dataesr/react-dsfr';
import { ChangeEvent, FormEvent, useState } from 'react';
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
          type="success"
          title="Fichier bien reçu"
          description="Le résultat vous sera envoyé par mail (pensez à vérifier vos spams)."
        />
      ) : (
        <form onSubmit={checkEligibility}>
          <File
            label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
            onChange={readFile}
            accept=".txt, .csv"
            errorMessage={error}
          />

          <TextInput
            type="email"
            placeholder="Tapez ici votre email *"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
          <Button
            disabled={isSubmitting || !email || !addresses || !!error}
            submit
          >
            Tester le fichier d’adresses
          </Button>
        </form>
      )}
    </Container>
  );
};

export default BulkEligibilityForm;
