import { faker } from '@faker-js/faker';
import { useEffect, useState } from 'react';

import ProEligibilityTestItem from '@/components/dashboard/professionnel/ProEligibilityTestItem';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import { useFetch, usePost } from '@/hooks/useApi';
import {
  type ProEligibilityTestCreateInput,
  type ProEligibilityTestCreateOutput,
  type ProEligibilityTestListItem,
} from '@/pages/api/pro-eligibility-tests';

export const testContent = `20 avenue de Ségur Paris
11 rue Mirabeau saint-maur-des-fossés
"1 avenue des trois frères, Asnières-sur-Seine"
"75 avenue Ferdinand de Lesseps, Grasse"
"71 rue Gustave Eiffel, ris-orangis"
"10 rue Descartes, Strasbourg"
"27 Rue Marie De Médicis, Cannes"
"22 rue de la République, Lyon"
adressebizarre
`;

export default function DashboardProfessionnel() {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);

  const { data: eligibilityTests, refetch: refetchEligibilityTests } = useFetch<ProEligibilityTestListItem[]>(
    '/api/pro-eligibility-tests',
    { refetchInterval: hasPendingJobs ? 5000 : false }
  );

  const { mutateAsync: createTest, isLoading } = usePost<ProEligibilityTestCreateInput, ProEligibilityTestCreateOutput>(
    '/api/pro-eligibility-tests',
    {
      invalidate: ['/api/pro-eligibility-tests'],
    }
  );

  useEffect(() => {
    setHasPendingJobs(eligibilityTests?.some((test) => test.has_pending_jobs) ?? false);
  }, [eligibilityTests]);

  return (
    <>
      <Heading as="h1" color="blue-france">
        Tableau de bord
      </Heading>
      {/* TODO raccourcis vers outils */}
      <Heading as="h2" color="blue-france">
        Historique de mes tests d’adresse
      </Heading>
      <div className="flex items-center justify-end">
        <Button
          loading={isLoading}
          className="my-5"
          onClick={async () =>
            createTest({
              name: 'test ' + faker.company.name(),
              csvContent: testContent,
            })
          }
        >
          Nouveau test
        </Button>
      </div>
      {eligibilityTests?.length === 0 && <>Aucun test</>}
      {eligibilityTests?.map((test) => <ProEligibilityTestItem test={test} key={test.id} onDelete={refetchEligibilityTests} />)}
      {/* TODO formulaire nouveau test */}
    </>
  );
}
