import ContributionForm from '@components/ContributionForm/ContributionForm';
import MainContainer from '@components/shared/layout';
import Slice from '@components/Slice';
import { Alert } from '@dataesr/react-dsfr';
import { submitToAirtable } from '@helpers';
import Head from 'next/head';
import { useState } from 'react';

const results: Record<
  string,
  {
    type: 'success' | 'error';
    title: string;
    description: string | Object | any[];
  }
> = {
  success: {
    type: 'success',
    title: 'Nous vous remercions pour votre contribution.',
    description:
      'Si vous avez indiqué souhaiter ajouter des données, vous recevrez très prochainement un lien par mail pour les télécharger.',
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
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string | Object | any[];
  }>();

  const submit = async (data: any) => {
    try {
      if (process.env.NEXT_PUBLIC_MOCK_CONTRIBUTION_CREATION === 'true') {
        console.info('Send following data to Airtabe', data);
      } else {
        await submitToAirtable(data, 'FCU - Contribution');
      }
      setResult(results.success);
    } catch (e) {
      setResult(results.error);
    }
  };

  return (
    <>
      <Head>
        <title>Contribuer : France Chaleur Urbaine</title>
      </Head>
      <MainContainer currentMenu="/contribution">
        <Slice
          padding={4}
          header={`## Vous souhaitez contribuer à cette carte en ajoutant des données ou en nous signalant une erreur ? C'est possible ! Complétez le formulaire ci-dessous :`}
        >
          {result ? (
            <Alert
              type={result.type}
              title={result.title}
              description={result.description}
            />
          ) : (
            <ContributionForm submit={submit} />
          )}
        </Slice>
      </MainContainer>
    </>
  );
}

export default Contribution;
