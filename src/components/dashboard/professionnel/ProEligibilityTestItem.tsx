import Badge from '@codegouvfr/react-dsfr/Badge';
import { useQuery } from '@tanstack/react-query';
import { type Selectable } from 'kysely';
import { useState } from 'react';

import Accordion from '@/components/ui/Accordion';
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
    queryFn: async () => {
      const testWithAddresses = await fetchJSON<ProEligibilityTestWithAddresses>(`/api/pro-eligibility-tests/${test.id}`);
      return {
        ...testWithAddresses,
        stats: {
          adressesCount: testWithAddresses.addresses.length,
          adressesEligiblesCount: testWithAddresses.addresses.filter(
            (address) => address.eligibility_status && address.eligibility_status.isEligible
          ).length,
          adressesProches150mReseauCount: testWithAddresses.addresses.filter(
            (address) => address.eligibility_status?.distance && address.eligibility_status.distance <= 150
          ).length,
          adressesDansPDPCount: testWithAddresses.addresses.filter(
            (address) => address.eligibility_status && address.eligibility_status.inPDP
          ).length,
        },
      };
    },
    enabled: viewDetail,
  });

  const deleteTest = toastErrors(async (testId: string) => {
    await deleteFetchJSON(`/api/pro-eligibility-tests/${testId}`);
    onDelete();
  });

  return (
    <Box>
      <Accordion
        label={
          <div className="flex justify-between w-full">
            <div>{test.name}</div>
            {/* FIXME réorganiser le typage */}
            {(test as any).has_pending_jobs && (
              <Badge severity="info" small className="fr-mr-2w">
                Mise à jour en attente
              </Badge>
            )}
          </div>
        }
        onExpandedChange={() => setViewDetail(true)}
      >
        <>
          {testDetails && (
            <>
              <div className="flex items-center">
                <Indicator label="Adresses" value={testDetails.stats.adressesCount} />
                <Divider />
                <Indicator label="Adresses raccordables" value={testDetails.stats.adressesEligiblesCount} />
                <Divider />
                <Indicator label="Adresses à moins de 150m d’un réseau" value={testDetails.stats.adressesProches150mReseauCount} />
                <Divider />
                <Indicator label="Adresses dans un PDP" value={testDetails.stats.adressesDansPDPCount} />
                <Button onClick={() => deleteTest(test.id)}>Supprimer</Button>
              </div>
              {testDetails.addresses.map((address) => (
                <Box key={address.id}>
                  {address.ban_address} - {address.source_address} - Eligible: {address.eligibility_status?.isEligible} - Distance:
                  {address.eligibility_status?.distance}
                </Box>
              ))}
            </>
          )}
        </>
      </Accordion>
    </Box>
  );
}

type IndicatorProps = {
  label: string;
  value: number;
};

const Indicator = ({ label, value }: IndicatorProps) => (
  <div className="fr-p-2w">
    <div className="font-bold text-xl">{value}</div>
    <div>{label}</div>
  </div>
);
const Divider = () => <div className="h-12 w-px bg-gray-300" />;
