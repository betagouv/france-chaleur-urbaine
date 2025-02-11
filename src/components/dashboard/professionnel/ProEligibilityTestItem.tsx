import Badge from '@codegouvfr/react-dsfr/Badge';
import { type SortingState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import { testContent } from '@/components/dashboard/DashboardProfessionnel';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useDelete, useFetch, usePost } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';
import { type ProEligibilityTestFileRequest, type ProEligibilityTestWithAddresses } from '@/pages/api/pro-eligibility-tests/[id]';
import { formatFrenchDate, formatFrenchDateTime } from '@/utils/date';
import { frenchCollator } from '@/utils/strings';

const columns: ColumnDef<ProEligibilityTestWithAddresses['addresses'][number]>[] = [
  {
    header: 'Adresse',
    accessorKey: 'ban_address',
    sortingFn: (rowA, rowB) => frenchCollator.compare(rowA.original.ban_address ?? '', rowB.original.ban_address ?? ''),
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
    flex: 2,
  },
  {
    header: 'Indice de fiabilité',
    accessorKey: 'ban_score',
    flex: 1,
    suffix: '%',
    align: 'right',
  },
  {
    header: 'Raccordable',
    accessorKey: 'eligibility_status.isEligible',
    cellType: 'Boolean',
    align: 'center',
  },
  {
    header: 'Distance au réseau',
    accessorKey: 'eligibility_status.distance',
    suffix: 'm',
    align: 'right',
  },
  {
    header: 'PDP',
    accessorKey: 'eligibility_status.inPDP',
    cellType: 'Boolean',
    align: 'center',
  },
  {
    header: 'Taux EnR&R',
    accessorKey: 'eligibility_status.tauxENRR',
    suffix: '%',
    align: 'right',
  },
  {
    header: 'Contenu CO2 ACV (g/kWh)',
    accessorKey: 'eligibility_status.co2',
    align: 'right',
  },
  {
    header: 'Identifiant',
    accessorKey: 'eligibility_status.id',
    align: 'right',
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
};

const queryParamName = 'test-adresses';

export default function ProEligibilityTestItem({ test }: ProEligibilityTestItemProps) {
  const [value] = useQueryState(queryParamName);
  const [viewDetail, setViewDetail] = useState(value === test.id);

  const { data: testDetails, isLoading } = useFetch<ProEligibilityTestWithAddresses>(`/api/pro-eligibility-tests/${test.id}`, {
    enabled: viewDetail,
  });

  const { mutateAsync: createTest, isLoading: isCreating } = usePost<ProEligibilityTestFileRequest>(
    `/api/pro-eligibility-tests/${test.id}`
  );
  const { mutateAsync: deleteTest, isLoading: isDeleting } = useDelete(`/api/pro-eligibility-tests/${test.id}`, {
    invalidate: ['/api/pro-eligibility-tests'],
  });

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
    if (!confirm('Etes-vous sûr de vouloir supprimer ce test ?')) {
      return;
    }
    await deleteTest(testId);
  };

  return (
    <Box>
      <UrlStateAccordion
        queryParamName={queryParamName}
        multi={false}
        id={test.id}
        label={
          <div className="flex items-center justify-between w-full">
            <div className="flex-auto">{test.name}</div>
            {test.has_unseen_results && (
              <Badge severity="info" small className="fr-mx-1w">
                Nouveaux résultats
              </Badge>
            )}
            {test.has_pending_jobs && (
              <Badge severity="new" small className="fr-mx-1w">
                Mise à jour en attente
              </Badge>
            )}
            <div className="fr-mx-1w text-xs text-gray-800 font-normal cursor-help" title={formatFrenchDateTime(new Date(test.updated_at))}>
              Dernière mise à jour&nbsp;: {formatFrenchDate(new Date(test.updated_at))}
            </div>
          </div>
        }
        onClose={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await handleDelete(test.id);
        }}
        onExpandedChange={(expanded) => setViewDetail(expanded)}
      >
        <div className="flex items-center">
          <Indicator loading={isLoading} label="Adresses" value={stats.adressesCount} />
          <Divider />
          <Indicator loading={isLoading} label="Adresses raccordables" value={stats.adressesEligiblesCount} />
          <Divider />
          <Indicator loading={isLoading} label="Adresses à moins de 150m d’un réseau" value={stats.adressesProches150mReseauCount} />
          <Divider />
          <Indicator loading={isLoading} label="Adresses dans un PDP" value={stats.adressesDansPDPCount} />
          <div className="ml-auto flex items-center gap-2">
            <Button iconId="ri-file-add-fill" size="small" onClick={() => createTest({ csvContent: testContent })} loading={isCreating}>
              Ajouter des adresses
            </Button>
            <Button size="small" onClick={() => handleDelete(test.id)} loading={isDeleting} variant="destructive" priority="secondary">
              <Icon name="ri-delete-bin-2-line" />
            </Button>
          </div>
        </div>
        <TableSimple columns={columns} data={testDetails?.addresses || []} initialSortingState={initialSortingState} />
      </UrlStateAccordion>
    </Box>
  );
}

type IndicatorProps = {
  label: string;
  value: number;
  loading?: boolean;
};

const Indicator = ({ label, value, loading }: IndicatorProps) => (
  <div className="fr-p-2w">
    <div className="font-bold text-xl">{!loading ? value : <Loader size="sm" className="my-[6px]" />}</div>
    <div>{label}</div>
  </div>
);
const Divider = () => <div className="h-12 w-px bg-gray-300" />;
