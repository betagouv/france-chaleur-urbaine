import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import { type Selectable } from 'kysely';
import { z } from 'zod';

import ProEligibilityTestItem from '@/components/dashboard/professionnel/ProEligibilityTestItem';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import { type ProEligibilityTests } from '@/server/db/kysely';
import { toastErrors } from '@/services/notification';
import { fetchJSON, postFetchJSON } from '@/utils/network';

const testContent = `20 avenue de Ségur Paris
11 rue Mirabeau saint-maur-des-fossés
"1 avenue des trois frères, Asnières-sur-Seine"
"75 avenue Ferdinand de Lesseps, Grasse"
"71 rue Gustave Eiffel, ris-orangis"
"10 rue Descartes, Strasbourg"
"27 Rue Marie De Médicis, Cannes"
"22 rue de la République, Lyon"
`;

export const zProEligibilityTestRequest = z.strictObject({
  name: z.string(),
  csvContent: z.string(),
});
export type ProEligibilityTestRequest = z.infer<typeof zProEligibilityTestRequest>;

export default function DashboardProfessionnel() {
  const { data: eligibilityTests, refetch: refetchEligibilityTests } = useQuery({
    queryKey: ['pro-eligibility-tests'],
    queryFn: () => fetchJSON<Selectable<ProEligibilityTests>[]>('/api/pro-eligibility-tests'),
  });

  const createTest = toastErrors(async () => {
    await postFetchJSON('/api/pro-eligibility-tests', {
      name: 'test ' + faker.company.name(),
      csvContent: testContent,
    } satisfies ProEligibilityTestRequest);
    await refetchEligibilityTests();
  });

  return (
    <>
      <Heading as="h1" color="blue-france">
        Tableau de bord
      </Heading>
      {/* TODO raccourcis vers outils */}
      <Heading as="h2" color="blue-france">
        Historique de mes tests d’adresse
      </Heading>
      <Button onClick={createTest}>Nouveau test</Button>
      {eligibilityTests?.length === 0 && <>Aucun test</>}
      {eligibilityTests?.map((test) => <ProEligibilityTestItem test={test} key={test.id} onDelete={refetchEligibilityTests} />)}
      {/* TODO formulaire nouveau test */}
    </>
  );
}
