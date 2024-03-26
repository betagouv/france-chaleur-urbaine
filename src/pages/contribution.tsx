import ContributionForm from '@components/ContributionForm/ContributionForm';
import SimplePage from '@components/shared/page/SimplePage';
import Slice from '@components/Slice';
import { Alert } from '@codegouvfr/react-dsfr';
import { submitToAirtable } from '@helpers/airtable';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import { Airtable } from 'src/types/enum/Airtable';

type ResultType = {
  type: 'success' | 'error';
  title: string;
  description?: ReactNode;
};

const results: Record<string, ResultType> = {
  success: {
    type: 'success',
    title: 'Nous vous remercions pour votre contribution.',
  },
  error: {
    type: 'error',
    title: 'Une erreur est survenue.',
    description: (
      <span>
        Veuillez réessayer plus tard, si le problème persiste contactez nous
        directement à l'adresse:{' '}
        <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">
          france-chaleur-urbaine@developpement-durable.gouv.fr
        </a>
      </span>
    ),
  },
};

function Contribution() {
  const router = useRouter();
  const [result, setResult] = useState<ResultType>();

  const submit = async (data: any) => {
    try {
      await submitToAirtable(data, Airtable.CONTRIBUTION);
      if (data.Souhait === 'Ajout de données') {
        router.push(
          'https://e.pcloud.com/#page=puplink&code=XjWZ2YJ44fMhie47yc9zWyMA35OElcQ7'
        );
      } else {
        setResult(results.success);
      }
    } catch (e) {
      setResult(results.error);
    }
  };

  return (
    <SimplePage title="Contribuer : France Chaleur Urbaine">
      <Slice
        padding={4}
        header={`## Vous souhaitez contribuer à notre carte en ajoutant des données ou en nous signalant une erreur ? C'est possible ! Complétez le formulaire ci-dessous :`}
      >
        {result ? (
          <Alert
            type={result.type}
            title={result.title}
            description={result.description as string}
          />
        ) : (
          <ContributionForm submit={submit} />
        )}
      </Slice>
    </SimplePage>
  );
}

export default Contribution;
