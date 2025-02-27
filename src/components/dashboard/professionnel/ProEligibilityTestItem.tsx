import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { useQueryClient } from '@tanstack/react-query';
import { type SortingState, type ColumnFiltersState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { unparse } from 'papaparse';
import { useState, useMemo } from 'react';

import CompleteEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/CompleteEligibilityTestForm';
import Map, { type AdresseEligible } from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
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
import { downloadString } from '@/utils/browser';
import { formatAsISODate, formatFrenchDate, formatFrenchDateTime } from '@/utils/date';
import { compareFrenchStrings } from '@/utils/strings';

const columns: ColumnDef<ProEligibilityTestWithAddresses['addresses'][number]>[] = [
  {
    header: 'Adresse',
    accessorKey: 'ban_address',
    accessorFn: (row) => `${row.ban_address} ${row.source_address}`,
    sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.ban_address, rowB.original.ban_address),
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
  const queryClient = useQueryClient();
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

  const filteredAddresses = useMemo(() => {
    if (!testDetails?.addresses) return [];

    return testDetails.addresses.filter((address) => {
      if (!columnFilters.length) return true;

      const filter = columnFilters[0];
      switch (filter.id) {
        case 'eligibility_status.isEligible':
          return address.eligibility_status?.isEligible === filter.value;
        case 'eligibility_status.distance':
          return address.eligibility_status?.distance != null && address.eligibility_status.distance <= (filter.value as number);
        case 'eligibility_status.inPDP':
          return address.eligibility_status?.inPDP === filter.value;
        default:
          return true;
      }
    });
  }, [testDetails?.addresses, columnFilters]);

  const filteredAddressesMapData = useMemo(() => {
    return filteredAddresses
      .filter((address) => address.ban_valid && address.geom)
      .map(
        (address) =>
          ({
            id: address.id,
            longitude: address.geom!.coordinates[0],
            latitude: address.geom!.coordinates[1],
            address: address.ban_address ?? '',
            isEligible: address.eligibility_status?.isEligible ?? false,
          }) satisfies AdresseEligible
      );
  }, [filteredAddresses]);

  const downloadCSV = () => {
    if (!filteredAddresses.length) return;

    const csvData = filteredAddresses.map((address) => ({
      adresse_source: address.source_address,
      adresse_ban: address.ban_address,
      indice_fiabilite: address.ban_score,
      raccordable: address.eligibility_status?.isEligible ? 'Oui' : 'Non',
      distance_reseau: address.eligibility_status?.distance,
      pdp: address.eligibility_status?.inPDP ? 'Oui' : 'Non',
      taux_enrr: address.eligibility_status?.tauxENRR,
      co2: address.eligibility_status?.co2,
      identifiant: address.eligibility_status?.id,
    }));

    const csv = unparse(csvData);

    downloadString(csv, `fcu-${test.name}-adresses-${formatAsISODate(new Date())}.csv`, 'text/csv;charset=utf-8;');
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
            <Indicator
              loading={isLoading}
              label="Adresses"
              value={stats.adressesCount}
              onClick={() => setColumnFilters([])}
              active={columnFilters.length === 0}
            />
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
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1" />
            <Button iconId="fr-icon-download-line" priority="secondary" onClick={downloadCSV} disabled={filteredAddresses.length === 0}>
              Télécharger
            </Button>

            <ModalSimple
              title="Ajout d'adresses"
              size="medium"
              trigger={
                <Button iconId="fr-icon-add-line" priority="secondary">
                  Ajouter des adresses
                </Button>
              }
            >
              <CompleteEligibilityTestForm testId={test.id} />
            </ModalSimple>

            <Button
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

        {viewDetail && (
          <Tabs
            tabs={[
              {
                label: 'Liste',
                iconId: 'fr-icon-list-unordered',
                content: (
                  <TableSimple
                    columns={columns}
                    data={testDetails?.addresses || []}
                    initialSortingState={initialSortingState}
                    columnFilters={columnFilters}
                    enableRowSelection
                    onSelectionChange={(selectedRows) => {
                      console.log('selection', selectedRows);
                    }}
                  />
                ),
                isDefault: true,
              },
              {
                label: 'Carte',
                iconId: 'fr-icon-map-pin-2-line',
                content: (
                  <div className="min-h-[50vh] aspect-[4/3]">
                    <Map
                      initialMapConfiguration={createMapConfiguration({
                        reseauxDeChaleur: {
                          show: true,
                        },
                        reseauxEnConstruction: true,
                        zonesDeDeveloppementPrioritaire: true,
                      })}
                      geolocDisabled
                      withLegend={false}
                      withoutLogo
                      adressesEligibles={filteredAddressesMapData}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
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
