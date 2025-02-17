import Badge from '@codegouvfr/react-dsfr/Badge';
import { type SortingState, type ColumnFiltersState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import CompleteEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/CompleteEligibilityTestForm';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useDelete, useFetch, usePost } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';
import { type ProEligibilityTestWithAddresses } from '@/pages/api/pro-eligibility-tests/[id]';
import { queryClient } from '@/services/query';
import { formatFrenchDate, formatFrenchDateTime } from '@/utils/date';
import { frenchCollator } from '@/utils/strings';

const columns: ColumnDef<ProEligibilityTestWithAddresses['addresses'][number]>[] = [
  {
    header: 'Adresse',
    accessorKey: 'ban_address',
    accessorFn: (row) => `${row.ban_address} ${row.source_address}`,
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
    id: 'eligibility_status.isEligible', // used to filter
    cellType: 'Boolean',
    align: 'center',
    filterFn: 'equals',
  },
  {
    header: 'Distance au réseau',
    accessorKey: 'eligibility_status.distance',
    id: 'eligibility_status.distance', // used to filter
    suffix: 'm',
    align: 'right',
    filterFn: (row, columnId, filterValue: number) => {
      const value = row.getValue<number>(columnId);
      return value != null && value <= filterValue;
    },
  },
  {
    header: 'PDP',
    accessorKey: 'eligibility_status.inPDP',
    id: 'eligibility_status.inPDP', // used to filter
    cellType: 'Boolean',
    align: 'center',
    filterFn: 'equals',
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

const queryParamName = 'test-adresses';

type ProEligibilityTestItemProps = {
  test: ProEligibilityTestListItem;
};

export default function ProEligibilityTestItem({ test }: ProEligibilityTestItemProps) {
  const [value] = useQueryState(queryParamName);
  const [viewDetail, setViewDetail] = useState(value === test.id);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: testDetails, isLoading } = useFetch<ProEligibilityTestWithAddresses>(`/api/pro-eligibility-tests/${test.id}`, {
    enabled: viewDetail,
  });
  const { mutateAsync: markAsSeen } = usePost(`/api/pro-eligibility-tests/${test.id}/mark-as-seen`, {
    onMutate: () => {
      queryClient.setQueryData<ProEligibilityTestListItem[]>(['/api/pro-eligibility-tests'], (tests) =>
        (tests ?? []).map((testItem) => (testItem.id === test.id ? { ...testItem, has_unseen_results: false } : testItem))
      );
    },
  });
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      return;
    }
    await deleteTest(testId);
  };

  const handleIndicatorClick = (filterKey: string, filterValue: boolean | number) => {
    setColumnFilters((prev) => {
      // toggle filter or add new filter
      return prev[0]?.id === filterKey ? [] : [{ id: filterKey, value: filterValue }];
    });
  };
  const isIndicatorFilterActive = (filterKey: string) => columnFilters[0]?.id === filterKey;

  return (
    <Box>
      <UrlStateAccordion
        queryParamName={queryParamName}
        multi={false}
        id={test.id}
        label={
          <div className="flex items-center justify-between w-full">
            <div className="flex-auto">{test.name}</div>
            {test.last_job_has_error && (
              <Badge severity="error" small className="fr-mx-1w">
                Erreur
              </Badge>
            )}
            {test.has_pending_jobs ? (
              <Badge severity="new" small className="fr-mx-1w">
                Mise à jour en attente
              </Badge>
            ) : (
              test.has_unseen_results && (
                <Badge severity="info" small className="fr-mx-1w">
                  Nouveaux résultats
                </Badge>
              )
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
        onExpandedChange={(expanded) => {
          setViewDetail(expanded);
          if (expanded && test.has_unseen_results) {
            markAsSeen({});
          }
        }}
      >
        <div className="flex flex-wrap mb-4">
          <div className="flex items-center">
            <Indicator loading={isLoading} label="Adresses" value={stats.adressesCount} />
            <Divider />
            <Indicator
              loading={isLoading}
              label="Adresses raccordables"
              value={stats.adressesEligiblesCount}
              onClick={() => handleIndicatorClick('eligibility_status.isEligible', true)}
              active={isIndicatorFilterActive('eligibility_status.isEligible')}
            />
            <Divider />
            <Indicator
              loading={isLoading}
              label="Adresses à moins de 150m d'un réseau"
              value={stats.adressesProches150mReseauCount}
              onClick={() => handleIndicatorClick('eligibility_status.distance', 150)}
              active={isIndicatorFilterActive('eligibility_status.distance')}
            />
            <Divider />
            <Indicator
              loading={isLoading}
              label="Adresses dans un PDP"
              value={stats.adressesDansPDPCount}
              onClick={() => handleIndicatorClick('eligibility_status.inPDP', true)}
              active={isIndicatorFilterActive('eligibility_status.inPDP')}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ModalSimple
              title="Ajout d'adresses"
              size="medium"
              trigger={
                <Button iconId="ri-file-add-fill" size="small" priority="secondary">
                  Ajouter des adresses
                </Button>
              }
            >
              <CompleteEligibilityTestForm testId={test.id} />
            </ModalSimple>

            <Button
              size="small"
              onClick={() => handleDelete(test.id)}
              loading={isDeleting}
              variant="destructive"
              priority="secondary"
              title="Supprimer le test"
            >
              <Icon name="ri-delete-bin-2-line" />
            </Button>
          </div>
        </div>
        <TableSimple
          columns={columns}
          data={testDetails?.addresses || []}
          initialSortingState={initialSortingState}
          columnFilters={columnFilters}
        />
      </UrlStateAccordion>
    </Box>
  );
}
type IndicatorProps = {
  label: string;
  value: number;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
};
const Indicator = ({ label, value, loading, onClick, active }: IndicatorProps) => {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      className={`fr-p-2w transition-colors ${active ? 'text-blue' : ''} ${onClick ? 'cursor-pointer hover:bg-gray-100 text-left' : ''}`}
      onClick={onClick}
      title={onClick ? 'Cliquer pour filtrer' : undefined}
    >
      <div className="font-bold text-xl">{loading ? <Loader size="sm" className="my-[6px]" /> : value}</div>
      <div>{label}</div>
    </Element>
  );
};

const Divider = () => <div className="h-12 w-px bg-gray-300" />;
