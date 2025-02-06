import Badge from '@codegouvfr/react-dsfr/Badge';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { useState } from 'react';

import { testContent } from '@/components/dashboard/DashboardProfessionnel';
import Accordion from '@/components/ui/Accordion';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import SimpleTable, { tableBooleanFormatter } from '@/components/ui/SimpleTable';
import { useDelete, useFetch, usePost } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';
import { type ProEligibilityTestFileRequest, type ProEligibilityTestWithAddresses } from '@/pages/api/pro-eligibility-tests/[id]';
import { frenchCollator } from '@/utils/strings';

const columns: ColumnDef<ProEligibilityTestWithAddresses['addresses'][number]>[] = [
  {
    header: 'Adresse',
    accessorKey: 'ban_address',
    sortingFn: (rowA, rowB) => frenchCollator.compare(rowA.original.ban_address, rowB.original.ban_address),
    cell: (info) => (
      <div>
        <div>
          <div className="color-blue">{info.row.original.ban_address}</div>
          {!info.row.original.ban_valid && (
            <Badge severity="error" small>
              Adresse invalide
            </Badge>
          )}
        </div>
        <div className=" text-xs text-gray-600">{info.row.original.source_address}</div>
      </div>
    ),
    size: 400,
  },
  {
    header: 'Indice de fiabilité',
    accessorKey: 'ban_score',
    size: 60,
  },
  {
    header: 'Raccordable',
    accessorKey: 'eligibility_status.isEligible',
    cell: tableBooleanFormatter,
    size: 100,
  },
  {
    header: 'Distance au réseau',
    accessorKey: 'eligibility_status.distance',
    size: 80,
  },
  {
    header: 'PDP',
    accessorKey: 'eligibility_status.inPDP',
    cell: tableBooleanFormatter,
    size: 60,
  },
  {
    header: 'Taux EnR&R',
    accessorKey: 'eligibility_status.tauxENRR',
    size: 60,
  },
  {
    header: 'Contenu CO2 ACV (g/kWh)',
    accessorKey: 'eligibility_status.co2',
    size: 80,
  },
  {
    header: 'Identifiant',
    accessorKey: 'eligibility_status.id',
    size: 80,
  },
];

const initialSortingState: SortingState = [
  {
    id: 'created_at',
    desc: true,
  },
];

type ProEligibilityTestItemProps = {
  test: ProEligibilityTestListItem;
  onDelete: () => any;
};

export default function ProEligibilityTestItem({ test, onDelete }: ProEligibilityTestItemProps) {
  const [viewDetail, setViewDetail] = useState(false);

  const { data: testDetails } = useFetch<ProEligibilityTestWithAddresses>(`/api/pro-eligibility-tests/${test.id}`, {
    enabled: viewDetail,
  });

  const { mutateAsync: createTest, isLoading: isCreating } = usePost<ProEligibilityTestFileRequest>(
    `/api/pro-eligibility-tests/${test.id}`
  );
  const { mutateAsync: deleteTest, isLoading: isDeleting } = useDelete(`/api/pro-eligibility-tests/${test.id}`);

  const addresses = testDetails?.addresses ?? [];

  const stats = {
    adressesCount: addresses.length,
    adressesEligiblesCount: addresses.filter((address) => address.eligibility_status && address.eligibility_status.isEligible).length,
    adressesProches150mReseauCount: addresses.filter(
      (address) => address.eligibility_status?.distance && address.eligibility_status.distance <= 150
    ).length,
    adressesDansPDPCount: addresses.filter((address) => address.eligibility_status && address.eligibility_status.inPDP).length,
  };

  const handleDelete = async (testId: string) => {
    await deleteTest(testId);
    onDelete();
  };

  return (
    <Box>
      <Accordion
        label={
          <div className="flex justify-between w-full">
            <div>{test.name}</div>
            {test.has_pending_jobs && (
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
                <Indicator label="Adresses" value={stats.adressesCount} />
                <Divider />
                <Indicator label="Adresses raccordables" value={stats.adressesEligiblesCount} />
                <Divider />
                <Indicator label="Adresses à moins de 150m d’un réseau" value={stats.adressesProches150mReseauCount} />
                <Divider />
                <Indicator label="Adresses dans un PDP" value={stats.adressesDansPDPCount} />
                <Button onClick={() => handleDelete(test.id)} loading={isDeleting} variant="destructive" priority="secondary">
                  <Icon name="ri-delete-bin-2-line" />
                </Button>
                <Button onClick={() => createTest({ csvContent: testContent })} loading={isCreating}>
                  Nouvelles adresses
                </Button>
              </div>
              <SimpleTable columns={columns} data={testDetails.addresses} initialSortingState={initialSortingState} />
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
