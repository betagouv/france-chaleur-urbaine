import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Papa from 'papaparse';
import { ChangeEvent, useState } from 'react';

import { isDevModeEnabled } from '@components/Map/components/DevModeIcon';
import SimplePage from '@components/shared/page/SimplePage';
import AsyncButton from '@components/ui/AsyncButton';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import { notify } from '@core/notification';
import { downloadFile } from '@utils/browser';
import { postFetchJSON } from '@utils/network';
import { latitudeColumnNameCandidates, longitudeColumnNameCandidates } from 'src/shared/bulk-eligibility-coordinates';
import { USER_ROLE } from 'src/types/enum/UserRole';

export default function TestCoordinatesPage() {
  const [coordinates, setCoordinates] = useState<Record<string, any>>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputFileName, setInputFileName] = useState('');

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = event.target.files?.[0];
    if (!file) {
      setCoordinates([]);
      return;
    }

    if (file.size > 15728640) {
      setErrorMessage('Le fichier ne doit pas dépasser 15Mo.');
      return;
    }
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setErrorMessage('Seuls les fichiers CSV sont reconnus');
      return;
    }
    setInputFileName(file.name);

    // pb avec la dernière ligne
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete(results) {
        if (results.errors.length > 0) {
          console.error('parsing errors:', results.errors);
        }
        if (results.errors.length === 1 && results.errors[0].code === 'TooFewFields') {
          results.data = results.data.slice(0, -1);
        }
        if (isDevModeEnabled()) {
          console.info('parsing results', results);
        }
        const columnNames = results.meta.fields!.map((f) => f.toLocaleLowerCase());
        if (!longitudeColumnNameCandidates.some((candidate) => columnNames.some((c) => c === candidate))) {
          setErrorMessage(`Aucune colonne longitude trouvée (${longitudeColumnNameCandidates.join(',')})`);
          return;
        }
        if (!latitudeColumnNameCandidates.some((candidate) => columnNames.some((c) => c === candidate))) {
          setErrorMessage(`Aucune colonne latitude trouvée (${latitudeColumnNameCandidates.join(',')})`);
          return;
        }
        setCoordinates(results.data);
      },
    });
  };

  const testCoordinatesEligibility = async () => {
    if (coordinates.length === 0) {
      return;
    }

    const results = await postFetchJSON('/api/admin/bulk-eligibility-coordinates', coordinates);
    const csvContent = Papa.unparse(results);
    const blob = new Blob([csvContent], {
      type: 'text/csv',
    });
    const inputFileNameWithoutExtension = inputFileName.slice(0, -4);
    downloadFile(URL.createObjectURL(blob), `${inputFileNameWithoutExtension}_avec_résultats_éligibilité_fcu.csv`);
    notify('success', "Le test s'est bien déroulé. Le fichier résultat a été téléchargé.");
  };

  return (
    <SimplePage title="France Chaleur Urbaine - Test de coordonnées géographiques" mode="authenticated">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Test de coordonnées géographiques
        </Heading>

        <Text>Cet outil permet de tester l'égibilité de coordonnées géographiques (longitude / latitude) en masse.</Text>
        <Text my="1w">
          Il faut déposer un fichier CSV avec une paire de coordonnées par ligne. Les coordonnées de longitude et latitude seront
          automatiquement détectées si elles ont des noms de colonnes parmi [{longitudeColumnNameCandidates.join(', ')}] et [
          {latitudeColumnNameCandidates.join(', ')}] respectivement.
        </Text>
        <Text mb="2w">Le test dure en général environ une dizaine de secondes pour 1000 coordonnées.</Text>

        <Upload
          label="Choisissez un fichier .csv :"
          hint=""
          state={errorMessage ? 'error' : 'default'}
          stateRelatedMessage={errorMessage}
          nativeInputProps={{
            accept: '.csv',
            onChange: onFileChange,
          }}
        />
        <AsyncButton
          type="submit"
          size="small"
          onClick={testCoordinatesEligibility}
          disabled={coordinates.length === 0}
          className="fr-mt-2w"
        >
          Tester l'éligibilité du fichier
        </AsyncButton>
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userSession = await getSession(context);

  if (!userSession) {
    return {
      redirect: {
        destination: '/connexion',
        permanent: false,
      },
    };
  }

  if (userSession.user.role !== USER_ROLE.ADMIN) {
    return {
      redirect: {
        destination: '/gestionnaire',
        permanent: false,
      },
    };
  }

  return { props: {} };
};
