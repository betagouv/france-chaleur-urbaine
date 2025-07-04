import { useQueryClient } from '@tanstack/react-query';
import { type Virtualizer } from '@tanstack/react-virtual';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type RefObject } from 'react';
import { type MapGeoJSONFeature } from 'react-map-gl/maplibre';

import TableFieldInput from '@/components/Admin/TableFieldInput';
import EligibilityHelpDialog, { eligibilityTitleByType } from '@/components/EligibilityHelpDialog';
import Input from '@/components/form/dsfr/Input';
import Comment from '@/components/Manager/Comment';
import Contact from '@/components/Manager/Contact';
import Tag from '@/components/Manager/Tag';
import { type AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ChipAutoComplete, { type ChipOption } from '@/components/ui/ChipAutoComplete';
import { VerticalDivider } from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import Indicator from '@/components/ui/Indicator';
import Loader from '@/components/ui/Loader';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/TableSimple';
import Tooltip from '@/components/ui/Tooltip';
import { useFetch } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { toastErrors } from '@/services/notification';
import { defaultTagChipOption, useFCUTags } from '@/services/tags';
import { type Point } from '@/types/Point';
import { type AdminDemand, type Demand } from '@/types/Summary/Demand';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { putFetchJSON } from '@/utils/network';
import { formatMWh, upperCaseFirstChar } from '@/utils/strings';
import { ObjectEntries, ObjectKeys } from '@/utils/typescript';

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

const displayModeDeChauffage = (demand: Demand) => {
  const modeDeChauffage = demand['Mode de chauffage']?.toLowerCase()?.trim();
  if (modeDeChauffage && ['gaz', 'fioul', 'électricité'].includes(modeDeChauffage)) {
    return `${upperCaseFirstChar(modeDeChauffage)} ${demand['Type de chauffage'] ? demand['Type de chauffage'].toLowerCase() : ''}`;
  }
  return demand['Type de chauffage'];
};

const quickFilterPresets = {
  demandesAAffecter: {
    label: (
      <>
        demandes à affecter&nbsp;
        <Tooltip title="Demandes dont les tags gestionnaire et l'affectation n'ont pas encore été validés" />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-flag-fill" size="sm" color="red" />,
    getStat: (demands) => demands.length,
    filters: [],
  },
} satisfies Record<string, QuickFilterPreset<AdminDemand>>;
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

const initialSortingState = [{ id: 'Date de la demande', desc: true }];

const defaultAssignmentChipOption: ChipOption = { title: '', key: 'Non affecté', label: 'Non affecté', className: 'bg-gray-200' };

function DemandesAdmin(): React.ReactElement {
  const queryClient = useQueryClient();
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>(null) as RefObject<Virtualizer<HTMLDivElement, Element>>;
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [filteredDemands, setFilteredDemands] = useState<AdminDemand[]>([]);

  const { data: demands = [], isLoading } = useFetch<AdminDemand[]>('/api/admin/demands');
  const { tagsOptions } = useFCUTags();
  const { data: assignmentRulesResults = [] } = useFetch<string[]>('/api/admin/assignment-rules/results');
  const assignmentRulesResultsOptions: ChipOption[] = useMemo(
    () =>
      assignmentRulesResults.map((rule) => ({
        key: rule,
        label: rule,
      })),
    [assignmentRulesResults]
  );

  const presetStats = ObjectKeys(quickFilterPresets).reduce(
    (acc, key) => ({
      ...acc,
      [key]: quickFilterPresets[key].getStat(demands),
    }),
    {} as Record<QuickFilterPresetKey, number>
  );

  // reset selection when filters change
  useEffect(() => {
    setSelectedDemandId(null);
  }, [filteredDemands]);

  const filteredDemandsMapData = useMemo(() => {
    return filteredDemands.map(
      (demand) =>
        ({
          id: demand.id,
          longitude: demand.Longitude,
          latitude: demand.Latitude,
          address: demand.Adresse,
          selected: demand.id === selectedDemandId,
          modeDeChauffage: displayModeDeChauffage(demand),
          typeDeLogement: demand.Structure,
        }) satisfies AdresseEligible
    );
  }, [filteredDemands, selectedDemandId]);

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<Demand>) => {
      queryClient.setQueryData<AdminDemand[]>(['/api/admin/demands'], (demands) =>
        (demands ?? []).map((demand) => {
          if (demand.id === demandId) {
            return { ...demand, ...demandUpdate };
          }
          return demand;
        })
      );
      await putFetchJSON(`/api/admin/demands/${demandId}`, demandUpdate);
    }),
    []
  );

  const tableColumns: ColumnDef<AdminDemand>[] = useMemo(
    () => [
      {
        id: 'indicators',
        header: '',
        align: 'center',
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {!row.original['Gestionnaires validés'] && (
              <Tooltip title="Cette demande n'a pas encore été validée par un gestionnaire">
                <Icon name="fr-icon-flag-fill" size="sm" color="red" />
              </Tooltip>
            )}
          </div>
        ),
        width: '46px',
      },
      {
        accessorKey: 'Gestionnaires',
        header: 'Gestionnaires',
        cell: (info) => {
          const demand = info.row.original;

          return (
            <div className="block">
              <div className="relative">
                <ChipAutoComplete
                  options={tagsOptions}
                  defaultOption={defaultTagChipOption}
                  value={demand.Gestionnaires ?? demand.recommendedTags.map((tag) => tag.name)}
                  onChange={(newGestionnaires) => {
                    updateDemand(demand.id, {
                      Gestionnaires: newGestionnaires,
                    });
                  }}
                  multiple
                />
                {/* visual indicator that the tags are suggested */}
                <div className="absolute top-0 right-1 z-10 flex gap-1">
                  {(!demand.Gestionnaires || demand.Gestionnaires.length === 0) && (
                    <Icon
                      name="fr-icon-sparkling-2-line"
                      size="xs"
                      color="blue"
                      className="cursor-help"
                      title="Tags suggérés automatiquement"
                    />
                  )}
                  {demand.Gestionnaires && demand.Gestionnaires.length > 0 && (
                    <button
                      onClick={() => updateDemand(demand.id, { Gestionnaires: undefined })}
                      className="p-0.5 hover:bg-gray-100 rounded"
                      title="Revoir les tags suggérés"
                    >
                      <Icon name="fr-icon-refresh-line" size="xs" color="blue" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EligibilityHelpDialog detailedEligibilityStatus={demand.detailedEligibilityStatus}>
                  <Button
                    className="!text-gray-700 !font-normal italic"
                    title="Voir le détail de l'éligibilité"
                    priority="tertiary no outline"
                    size="small"
                  >
                    {eligibilityTitleByType[demand.detailedEligibilityStatus.eligibilityType]}
                  </Button>
                </EligibilityHelpDialog>
              </div>
              <div className="my-1">
                {demand.detailedEligibilityStatus.eligibilityType !== 'trop_eloigne' &&
                  !demand.detailedEligibilityStatus.communes.includes(demand.detailedEligibilityStatus.commune.nom!) && (
                    <Badge
                      type="warning_ville_differente"
                      title={`La ville de la demande (${demand.detailedEligibilityStatus.commune.nom!}) ne correspond pas à ${demand.detailedEligibilityStatus.communes.length > 1 ? 'aux villes' : 'la ville'} du réseau (${demand.detailedEligibilityStatus.communes.join(', ')})`}
                    />
                  )}
              </div>
            </div>
          );
        },
        width: '400px',
        enableSorting: false,
      },
      {
        accessorKey: 'Affecté à',
        header: 'Affecté à',
        cell: (info) => {
          const demand = info.row.original;
          return (
            <div className="block relative">
              <ChipAutoComplete
                options={assignmentRulesResultsOptions}
                defaultOption={defaultAssignmentChipOption}
                value={demand['Affecté à'] || demand.recommendedAssignment || ''}
                onChange={(value) => updateDemand(demand.id, { 'Affecté à': value })}
                className="w-full"
              />
              <div className="absolute top-0 right-1 z-10 flex gap-1">
                {/* visual indicator that the tag is suggested */}
                {!demand['Affecté à'] && (
                  <Icon
                    name="fr-icon-sparkling-2-line"
                    size="xs"
                    color="blue"
                    className="cursor-help"
                    title="Affectation suggérée automatiquement"
                  />
                )}
                {demand['Affecté à'] && demand['Affecté à'] !== demand.recommendedAssignment && (
                  <button
                    onClick={() => updateDemand(demand.id, { 'Affecté à': '' })}
                    className="p-0.5 hover:bg-gray-100 rounded"
                    title="Revoir l'affectation suggérée"
                  >
                    <Icon name="fr-icon-refresh-line" size="xs" color="blue" />
                  </button>
                )}
              </div>
            </div>
          );
        },
        width: '200px',
        enableSorting: false,
      },
      {
        accessorKey: 'Gestionnaires validés',
        header: 'Gestionnaire validé',
        align: 'center',
        cell: (info) =>
          info.row.original['Gestionnaires validés'] ? (
            <span className="text-green-500 text-3xl">✓</span>
          ) : (
            <AsyncButton
              priority="primary"
              size="small"
              onClick={async () => {
                const demand = info.row.original;
                updateDemand(demand.id, {
                  // assign recommended tags if no gestionnaires are set
                  ...(!demand.Gestionnaires || demand.Gestionnaires.length === 0
                    ? {
                        Gestionnaires: demand.recommendedTags.map((tag) => tag.name),
                      }
                    : {}),
                  // assign recommended assignment if none is set
                  ...(!demand['Affecté à']
                    ? {
                        'Affecté à': demand.recommendedAssignment,
                      }
                    : {}),
                  'Gestionnaires validés': true,
                });
              }}
            >
              Valider
            </AsyncButton>
          ),
        width: '120px',
        enableSorting: false,
      },
      {
        accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
        header: 'Contact',
        cell: ({ row }) => <Contact demand={row.original} onEmailClick={() => {}} />,
        width: '280px',
        enableSorting: false,
      },
      {
        accessorKey: 'Structure',
        header: 'Type',
        cell: ({ row }) => <Tag text={row.original.Structure} />,
        width: '130px',
        enableGlobalFilter: false,
        enableSorting: false,
      },
      {
        accessorFn: (row) => displayModeDeChauffage(row),
        header: 'Mode de chauffage',
        cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
        width: '134px',
        enableGlobalFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'Adresse',
        header: 'Adresse',
        cell: ({ row }) => <div className="whitespace-normal">{row.original.Adresse}</div>,
        width: '220px',
        enableSorting: false,
      },
      {
        accessorKey: 'Date de la demande',
        header: 'Date de la demande',
        cellType: 'DateTime',
        width: '94px',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'Distance au réseau',
        header: () => (
          <div className="flex items-center">
            Distance au réseau (m)
            <Tooltip
              iconProps={{
                className: 'ml-1',
              }}
              title="Distance à vol d'oiseau"
            />
          </div>
        ),
        cell: (info) => info.getValue<number>() && <>{info.getValue<number>()}&nbsp;m</>,
        width: '120px',
        enableGlobalFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'Identifiant réseau',
        header: 'ID réseau le plus proche',
        cell: (info) => {
          const demand = info.row.original;
          return (
            <TableFieldInput
              title="Identifiant réseau"
              value={demand['Identifiant réseau'] ?? ''}
              onChange={(value) => updateDemand(demand.id, { 'Identifiant réseau': value })}
            />
          );
        },
        width: '85px',
        enableSorting: false,
      },
      {
        accessorKey: 'Nom réseau',
        header: 'Nom du réseau le plus proche',
        cell: (info) => {
          const demand = info.row.original;
          return (
            <TableFieldInput
              className="w-[250px]"
              title="Nom du réseau"
              value={demand['Nom réseau'] ?? ''}
              onChange={(value) => updateDemand(demand.id, { 'Nom réseau': value })}
            />
          );
        },
        width: '250px',
        enableSorting: false,
      },
      {
        accessorKey: 'Logement',
        header: 'Nb logements (lots)',
        cell: (info) => info.getValue<number>() && <>{info.getValue<number>()}&nbsp;</>,
        width: '120px',
        enableGlobalFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'Surface en m2',
        header: 'Surface en m2',
        cell: (info) => info.getValue<number>() && <>{info.getValue<number>()}&nbsp;m²</>,
        width: '120px',
        enableGlobalFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'Conso',
        header: 'Conso gaz (MWh)',
        cell: (info) => info.getValue<number>() && formatMWh(info.getValue<number>()),
        width: '120px',
        enableGlobalFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'Commentaire',
        header: 'Commentaire',
        cell: ({ row }) => <Comment demand={row.original} field="Commentaire" updateDemand={updateDemand} />,
        width: '280px',
        enableSorting: false,
      },
      {
        accessorKey: 'Commentaires_internes_FCU',
        header: 'Commentaires internes FCU',
        cell: ({ row }) => <Comment demand={row.original} field="Commentaires_internes_FCU" updateDemand={updateDemand} />,
        width: '280px',
        enableSorting: false,
      },
    ],
    [updateDemand, tagsOptions]
  );

  const onFeatureClick = useCallback(
    (feature: MapGeoJSONFeature) => {
      if (feature.source !== 'adressesEligibles') {
        return;
      }
      setSelectedDemandId(feature.id as string);
      const rowIndex = filteredDemands.findIndex((demand) => demand.id === feature.id);
      virtualizerRef.current?.scrollToIndex(rowIndex, { align: 'center' });
    },
    [filteredDemands, virtualizerRef.current]
  );

  const onTableRowClick = useCallback(
    (demandId: string) => {
      setSelectedDemandId(demandId);
      const selectedDemand = demands.find((demand) => demand.id === demandId);
      if (selectedDemand) {
        setMapCenterLocation({
          center: [selectedDemand.Longitude, selectedDemand.Latitude],
          zoom: 16,
          flyTo: true,
        });
      }
    },
    [demands]
  );

  const onTableFiltersChange = useCallback((demands: AdminDemand[]) => {
    setFilteredDemands(demands);

    // center on the first demand if any
    const firstDemand = demands[0];
    if (firstDemand) {
      setMapCenterLocation({
        center: [firstDemand.Longitude, firstDemand.Latitude],
        zoom: 8,
        flyTo: true,
      });
    }
  }, []);

  return (
    <SimplePage
      title="Validation des demandes"
      description="Tableau de bord administrateur pour la validation des tags des demandes de raccordement"
      mode="authenticated"
    >
      <div className="mb-8">
        <div className="flex items-center flex-wrap gap-4">
          <Input
            label=""
            nativeInputProps={{
              'aria-label': 'rechercher',
              required: true,
              placeholder: 'Rechercher par nom, email, adresse...',
              value: globalFilter,
              onChange: (e) => setGlobalFilter(e.target.value),
            }}
            className="p-2w !mb-0 w-[350px]"
          />
          {ObjectEntries(quickFilterPresets).map(([key, preset], index) => (
            <Fragment key={key}>
              <Indicator
                loading={isLoading}
                label={preset.label}
                value={presetStats[key]}
                valueSuffix={'valueSuffix' in preset ? preset.valueSuffix : null}
              />
              {index < Object.keys(quickFilterPresets).length - 1 && <VerticalDivider className="hidden md:block" />}
            </Fragment>
          ))}
          <EligibilityHelpDialog />
        </div>
        <ResizablePanelGroup direction="horizontal" className="gap-4">
          <ResizablePanel defaultSize={66}>
            <TableSimple
              columns={tableColumns}
              data={demands}
              loading={isLoading}
              initialSortingState={initialSortingState}
              globalFilter={globalFilter}
              onFilterChange={onTableFiltersChange}
              fluid
              controlsLayout="block"
              padding="sm"
              rowSelection={tableRowSelection}
              onRowClick={onTableRowClick}
              loadingEmptyMessage="Aucune demande à afficher"
              height="calc(100dvh - 140px)"
              virtualizerRef={virtualizerRef}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={34}>
            <div className={cx('max-md:h-[600px] md:h-[calc(100dvh-140px)] bg-[#F8F4F0]')}>
              {isDefined(mapCenterLocation) ? (
                <Map
                  noPopup
                  withoutLogo
                  initialCenter={mapCenterLocation.center}
                  initialZoom={mapCenterLocation.zoom}
                  enableFlyToCentering
                  initialMapConfiguration={createMapConfiguration({
                    reseauxDeChaleur: {
                      show: true,
                    },
                    reseauxEnConstruction: true,
                    zonesDeDeveloppementPrioritaire: true,
                  })}
                  geolocDisabled
                  withSoughtAddresses={false}
                  adressesEligibles={filteredDemandsMapData}
                  adressesEligiblesAutoFit={false}
                  onFeatureClick={onFeatureClick}
                />
              ) : (
                <div className="absolute inset-0 flex justify-center items-center animate-pulse">
                  <Loader size="lg" />
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SimplePage>
  );
}

export default DemandesAdmin;

export const getServerSideProps = withAuthentication(['admin']);
