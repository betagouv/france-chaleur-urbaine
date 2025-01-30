import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import { toastErrors } from '@/services/notification';
import { deleteFetchJSON, fetchJSON, postFetchJSON } from '@/utils/network';

const testContent = `20 avenue de Ségur Paris
11 rue Mirabeau saint-maur-des-fossés
1 avenue des trois frères, Asnières-sur-Seine
75 avenue Ferdinand de Lesseps, Grasse
71 rue Gustave Eiffel, ris-orangis
10 rue Descartes, Strasbourg
27 Rue Marie De Médicis, Cannes
22 rue de la République, Lyon
`;

export const zProEligibilityTestRequest = z.strictObject({
  name: z.string(),
  csvContent: z.string(),
});
export type ProEligibilityTestRequest = z.infer<typeof zProEligibilityTestRequest>;

export default function DashboardProfessionnel() {
  const { data: eligibilityTests, refetch: refetchEligibilityTests } = useQuery({
    queryKey: ['pro-eligibility-tests'],
    queryFn: () => fetchJSON<any[]>('/api/pro-eligibility-tests'),
  });

  const createTest = toastErrors(async () => {
    await postFetchJSON('/api/pro-eligibility-tests', {
      name: 'test ' + new Date(),
      csvContent: testContent,
    } satisfies ProEligibilityTestRequest);
    await refetchEligibilityTests();
  });

  const deleteTest = toastErrors(async (testId: string) => {
    await deleteFetchJSON(`/api/pro-eligibility-tests/${testId}`);
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
      {eligibilityTests?.map((test) => (
        <Box key={test.id}>
          {test.id} - {test.created_at}
          <Button onClick={() => deleteTest(test.id)}>Supprimer</Button>
        </Box>
      ))}
      {/* TODO liste des tests d'adresse */}
      {/* TODO pour un test, si déplie, on récupère le détail */}
      {/* TODO formulaire nouveau test */}
    </>
  );
}
