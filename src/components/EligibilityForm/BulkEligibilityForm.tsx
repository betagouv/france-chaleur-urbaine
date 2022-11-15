import { Alert, Button, File, TextInput } from '@dataesr/react-dsfr';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useServices } from 'src/services';
import { Container } from './BulkEligibilityForm.styles';

const BulkEligibilityForm = () => {
  const { heatNetworkService } = useServices();
  const [addresses, setAddresses] = useState<string[]>();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      setAddresses([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const text = e.target.result as string;
        setAddresses(
          text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line)
        );
      }
    };
    reader.readAsText(event.target.files[0]);
  };

  const checkEligibility = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addresses || addresses.length === 0) {
      return;
    }

    heatNetworkService.bulkEligibility(addresses, email).then(() => {
      setSent(true);
    });
  };

  return (
    <Container>
      {sent ? (
        <Alert
          type="success"
          title="Fichier bien reçu"
          description="Le résultat vous sera envoyé par mail (pensez à verifier vos spams)."
        />
      ) : (
        <form onSubmit={checkEligibility}>
          <File
            label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
            onChange={readFile}
            accept=".txt, .csv"
          />

          <TextInput
            label="Email :"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
          <Button
            disabled={!email || !addresses || addresses.length === 0}
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
