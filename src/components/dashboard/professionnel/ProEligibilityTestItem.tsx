import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { useQueryClient } from '@tanstack/react-query';
import { type SortingState, type ColumnFiltersState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useState, useMemo, useEffect } from 'react';

import CompleteEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/CompleteEligibilityTestForm';
import Map, { type AdresseEligible } from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useDelete, useFetch, usePost } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';
import { type ProEligibilityTestWithAddresses } from '@/pages/api/pro-eligibility-tests/[id]';
import { notify, toastErrors } from '@/services/notification';
import { getProEligibilityTestAsXlsx } from '@/services/xlsx';
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
    flex: 1,
  },
  {
    header: 'Indice de fiabilité',
    accessorKey: 'ban_score',
    width: '130px',
    suffix: '%',
    align: 'right',
  },
  {
    header: 'Raccordable',
    width: '130px',
    accessorKey: 'eligibility_status.isEligible',
    id: 'eligibility_status.isEligible', // used to filter
    cellType: 'Boolean',
    align: 'center',
    filterFn: 'equals',
  },
  {
    header: 'Distance au réseau',
    width: '130px',
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
    width: '100px',
    accessorKey: 'eligibility_status.inPDP',
    id: 'eligibility_status.inPDP', // used to filter
    cellType: 'Boolean',
    align: 'center',
    filterFn: 'equals',
  },
  {
    header: 'Taux EnR&R',
    width: '130px',
    accessorKey: 'eligibility_status.tauxENRR',
    suffix: '%',
    align: 'right',
    filterFn: (row, columnId, filterValue: number) => {
      const value = row.getValue<number>(columnId);
      return value != null && value >= filterValue;
    },
  },
  {
    header: 'Contenu CO2 ACV (g/kWh)',
    width: '130px',
    accessorKey: 'eligibility_status.co2',
    align: 'right',
  },
  {
    header: 'Identifiant',
    width: '130px',
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

const quickFilterPresets = {
  all: {
    label: 'adresses',
    filters: [],
  },
  adressesEligibles: {
    label: 'potentiellement raccordables',
    filters: [{ id: 'eligibility_status.isEligible', value: true }],
  },
  adressesMoins100mPlus50ENRR: {
    label: "à moins de 100m d'un réseau à plus de 50% d'ENRR",
    filters: [
      { id: 'eligibility_status.distance', value: 100 },
      { id: 'eligibility_status.tauxENRR', value: 50 },
    ],
  },
  adressesDansPDP: {
    label: 'dans un périmètre de développement prioritaire',
    filters: [{ id: 'eligibility_status.inPDP', value: true }],
  },
};
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

const queryParamName = 'test-adresses';

type ProEligibilityTestItemProps = {
  test: ProEligibilityTestListItem;
};
export default function ProEligibilityTestItem({ test }: ProEligibilityTestItemProps) {
  const queryClient = useQueryClient();
  const [value] = useQueryState(queryParamName);
  const [viewDetail, setViewDetail] = useState(value === test.id);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const {
    data: testDetails,
    isLoading,
    refetch,
  } = useFetch<ProEligibilityTestWithAddresses>(`/api/pro-eligibility-tests/${test.id}`, {
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
    adressesEligibles: addresses.filter((address) => address.eligibility_status && address.eligibility_status.isEligible).length,
    adressesMoins100mPlus50ENRR: addresses.filter(
      (address) =>
        address.eligibility_status?.distance &&
        address.eligibility_status.distance <= 100 &&
        address.eligibility_status?.tauxENRR &&
        address.eligibility_status.tauxENRR >= 50
    ).length,
    adressesDansPDP: addresses.filter((address) => address.eligibility_status && address.eligibility_status.inPDP).length,
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      return;
    }
    await deleteTest(testId);
  };

  const toggleFilterPreset = (presetKey: QuickFilterPresetKey) => {
    const preset = quickFilterPresets[presetKey];
    setColumnFilters(isPresetActive(presetKey) ? [] : preset.filters);
  };

  const isPresetActive = (presetKey: QuickFilterPresetKey) => {
    const preset = quickFilterPresets[presetKey];
    if (preset.filters.length === 0) {
      return columnFilters.length === 0;
    }

    // Check if all filters in the preset are active
    return (
      preset.filters.every((presetFilter) =>
        columnFilters.some((activeFilter) => activeFilter.id === presetFilter.id && activeFilter.value === presetFilter.value)
      ) && columnFilters.length === preset.filters.length
    );
  };

  useEffect(() => {
    if (viewDetail && test.has_unseen_results) {
      (async () => {
        void markAsSeen({});
        await refetch();
        notify('success', 'Les résultats de ce test ont été mis à jour');
      })();
    }
  }, [viewDetail, test.has_unseen_results, markAsSeen, refetch]);

  const filteredAddresses = useMemo(() => {
    if (!testDetails?.addresses) return [];

    return testDetails.addresses.filter((address) => {
      if (!columnFilters.length) return true;

      return columnFilters.every((filter) => {
        switch (filter.id) {
          case 'eligibility_status.isEligible':
            return address.eligibility_status?.isEligible === filter.value;
          case 'eligibility_status.distance':
            return address.eligibility_status?.distance != null && address.eligibility_status.distance <= (filter.value as number);
          case 'eligibility_status.inPDP':
            return address.eligibility_status?.inPDP === filter.value;
          case 'eligibility_status.tauxENRR':
            return address.eligibility_status?.tauxENRR != null && address.eligibility_status.tauxENRR >= (filter.value as number);
          default:
            return true;
        }
      });
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

  const downloadCSV = toastErrors(async () => {
    if (!filteredAddresses.length) return;

    const xlsx = await getProEligibilityTestAsXlsx(filteredAddresses);

    downloadString(
      xlsx,
      `fcu-${test.name}-adresses-${formatAsISODate(new Date())}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });

  return (
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
            label={quickFilterPresets.all.label}
            value={stats.adressesCount}
            onClick={() => toggleFilterPreset('all')}
            active={isPresetActive('all')}
          />
          <Divider />
          <Indicator
            loading={isLoading}
            label={quickFilterPresets.adressesEligibles.label}
            value={stats.adressesEligibles}
            onClick={() => toggleFilterPreset('adressesEligibles')}
            active={isPresetActive('adressesEligibles')}
          />
          <Divider />
          <Indicator
            loading={isLoading}
            label={quickFilterPresets.adressesMoins100mPlus50ENRR.label}
            value={stats.adressesMoins100mPlus50ENRR}
            onClick={() => toggleFilterPreset('adressesMoins100mPlus50ENRR')}
            active={isPresetActive('adressesMoins100mPlus50ENRR')}
          />
          <Divider />
          <Indicator
            loading={isLoading}
            label={quickFilterPresets.adressesDansPDP.label}
            value={stats.adressesDansPDP}
            onClick={() => toggleFilterPreset('adressesDansPDP')}
            active={isPresetActive('adressesDansPDP')}
          />
        </div>
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1" />
          <Button iconId="fr-icon-download-line" priority="secondary" onClick={downloadCSV} disabled={filteredAddresses.length === 0}>
            Télécharger le détail
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
      className={`fr-p-2w flex flex-col h-full transition-colors ${active ? 'text-blue' : ''} ${onClick ? 'cursor-pointer hover:bg-gray-100 text-left' : ''}`}
      onClick={onClick}
      title={onClick ? 'Cliquer pour filtrer' : undefined}
    >
      <div className="font-bold text-xl">{loading ? <Loader size="sm" className="my-[6px]" /> : value}</div>
      <div>{label}</div>
    </Element>
  );
};

const Divider = () => <div className="h-12 w-px bg-gray-300" />;
