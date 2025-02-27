import { Upload } from '@codegouvfr/react-dsfr/Upload';
import Papa from 'papaparse';
import { type ChangeEvent, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import { isDevModeEnabled } from '@/hooks/useDevMode';
import { withAuthentication } from '@/server/authentication';
import { notify, toastErrors } from '@/services/notification';
import { latitudeColumnNameCandidates, longitudeColumnNameCandidates } from '@/shared/bulk-eligibility-coordinates';
import { chunk } from '@/utils/array';
import { downloadFile } from '@/utils/browser';
import { isDefined } from '@/utils/core';
import { postFetchJSON } from '@/utils/network';

export default function TestCoordinatesPage() {
  const [coordinates, setCoordinates] = useState<Record<string, any>[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputFileName, setInputFileName] = useState('');
  const [progress, setProgress] = useState<number | null>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = event.target.files?.[0];
    if (!file) {
      setCoordinates([]);
      return;
    }

    if (file.size > 15728640) {
      setErrorMessage('Le fichier ne doit pas dépasser 15Mo.');
      setCoordinates([]);
      return;
    }
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setErrorMessage('Seuls les fichiers CSV sont reconnus');
      setCoordinates([]);
      return;
    }
    setInputFileName(file.name);

    Papa.parse<Record<string, any>>(file, {
      header: true,
      dynamicTyping: true,
      complete(results) {
        if (results.errors.length > 0) {
          console.error('parsing errors:', results.errors);
        }
        if (isDevModeEnabled()) {
          console.info('parsing results', results);
        }
        const columnNames = results.meta.fields!.map((f) => f.toLocaleLowerCase());
        if (!longitudeColumnNameCandidates.some((candidate) => columnNames.some((c) => c === candidate))) {
          setErrorMessage(`Aucune colonne longitude trouvée (${longitudeColumnNameCandidates.join(',')})`);
          setCoordinates([]);
          return;
        }
        if (!latitudeColumnNameCandidates.some((candidate) => columnNames.some((c) => c === candidate))) {
          setErrorMessage(`Aucune colonne latitude trouvée (${latitudeColumnNameCandidates.join(',')})`);
          setCoordinates([]);
          return;
        }

        // remove lines that have errors
        results.errors
          .filter((error) => error.type === 'FieldMismatch')
          .toReversed() // reverse indexes because we will modify data inplace
          .forEach((error) => {
            results.data.splice(error.row as number, 1);
          });

        setCoordinates(results.data);
      },
    });
  };

  const testCoordinatesEligibility = toastErrors(async () => {
    if (coordinates.length === 0) {
      return;
    }

    setProgress(0);
    const allResults = [];
    // on découpe les données pour éviter que les requêtes ne dépassent 1 minute qui est le temps maximum côté Scalingo
    const chunks = chunk(coordinates, 200);
    for (const [index, chunk] of chunks.entries()) {
      const batchResults = await postFetchJSON('/api/admin/bulk-eligibility-coordinates', chunk);
      allResults.push(...batchResults);
      setProgress(index / chunks.length);
    }
    setProgress(null);

    const csvContent = Papa.unparse(allResults);
    const blob = new Blob([csvContent], {
      type: 'text/csv',
    });
    const inputFileNameWithoutExtension = inputFileName.slice(0, -4);
    downloadFile(URL.createObjectURL(blob), `${inputFileNameWithoutExtension}_avec_résultats_éligibilité_fcu.csv`);
    notify('success', "Le test s'est bien déroulé. Le fichier résultat a été téléchargé.");
  });

  const estimatedWaitTimeMinutes = Math.max(1, Math.round(((coordinates.length / 1000) * 20) / 60));

  return (
    <SimplePage title="Test de coordonnées géographiques" mode="authenticated">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Test de coordonnées géographiques
        </Heading>

        <div className="mb-1w">Cet outil permet de tester l'égibilité de coordonnées géographiques (longitude / latitude) en masse.</div>
        <div className="mb-1w">
          Il faut déposer un fichier CSV avec une paire de coordonnées par ligne. Les coordonnées de longitude et latitude seront
          automatiquement détectées si elles ont des noms de colonnes parmi [{longitudeColumnNameCandidates.join(', ')}] et [
          {latitudeColumnNameCandidates.join(', ')}] respectivement.
        </div>
        <div className="mb-2w">
          Le test dure en général environ une vingtaine de secondes pour 1000 coordonnées.{' '}
          {coordinates.length > 0 && (
            <>
              Ici, {coordinates.length} coordonnées ont été détectées et le test devrait durer environ {estimatedWaitTimeMinutes} minute
              {estimatedWaitTimeMinutes > 1 && 's'}.
            </>
          )}
        </div>

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
        <br />
        {isDefined(progress) && <progress value={progress} />}
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication('admin');
