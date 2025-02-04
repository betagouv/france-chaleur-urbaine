import { useQuery } from '@tanstack/react-query';
import { type Selectable } from 'kysely';
import { useState } from 'react';

import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { type ProEligibilityTestWithAddresses } from '@/pages/api/pro-eligibility-tests/[id]';
import { type ProEligibilityTests } from '@/server/db/kysely';
import { toastErrors } from '@/services/notification';
import { deleteFetchJSON, fetchJSON } from '@/utils/network';
import { type FrontendType } from '@/utils/typescript';

type ProEligibilityTestItemProps = {
  test: FrontendType<Selectable<ProEligibilityTests>>;
  onDelete: () => any;
};

export default function ProEligibilityTestItem({ test, onDelete }: ProEligibilityTestItemProps) {
  const [viewDetail, setViewDetail] = useState(false);

  const { data: testDetails } = useQuery({
    queryKey: [`pro-eligibility-tests/${test.id}`],
    queryFn: () => fetchJSON<ProEligibilityTestWithAddresses>(`/api/pro-eligibility-tests/${test.id}`),
    enabled: viewDetail,
  });

  const deleteTest = toastErrors(async (testId: string) => {
    await deleteFetchJSON(`/api/pro-eligibility-tests/${testId}`);
    onDelete();
  });

  return (
    <Box>
      <Box>
        <Button onClick={() => setViewDetail(true)}>
          {test.name} - {test.created_at}
        </Button>
        <Button onClick={() => deleteTest(test.id)}>Supprimer</Button>
      </Box>

      {testDetails &&
        testDetails.addresses.map((address) => (
          <Box key={address.id}>
            {address.ban_address} - {address.source_address} - Eligible: {address.eligibility_status.isEligible} - Distance:
            {address.eligibility_status.distance}
          </Box>
        ))}
    </Box>
  );
}
