import { usePrevious } from '@react-hookz/web';
import type { Virtualizer } from '@tanstack/react-virtual';
import dynamic from 'next/dynamic';
import { Fragment, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre';

import TableFieldInput from '@/components/Admin/TableFieldInput';
import EligibilityHelpDialog, { eligibilityTitleByType } from '@/components/EligibilityHelpDialog';
import Input from '@/components/form/dsfr/Input';
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { useMapEventBus } from '@/components/Map/layers/common';
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
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { useFetch } from '@/hooks/useApi';
import Comment from '@/modules/demands/client/Comment';
import Contact from '@/modules/demands/client/Contact';
import type { Demand } from '@/modules/demands/types';
import { notify, toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { withAuthentication } from '@/server/authentication';
import type { DetailedEligibilityStatus } from '@/server/services/addresseInformation';
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { stopPropagation } from '@/utils/events';
import { deleteFetchJSON } from '@/utils/network';
import { formatMWh, upperCaseFirstChar } from '@/utils/strings';
import { ObjectEntries, ObjectKeys } from '@/utils/typescript';

type DemandsListAdminItem = RouterOutput['demands']['admin']['list'][number];

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

const displayModeDeChauffage = (demand: DemandsListAdminItem) => {
  const modeDeChauffage = demand['Mode de chauffage']?.toLowerCase()?.trim();
  if (modeDeChauffage && ['gaz', 'fioul', 'électricité'].includes(modeDeChauffage)) {
    return `${upperCaseFirstChar(modeDeChauffage)} ${demand['Type de chauffage'] ? demand['Type de chauffage'].toLowerCase() : ''}`;
  }
  return demand['Type de chauffage'];
};

const quickFilterPresets = {
  demandesAAffecter: {
    filters: [],
    getStat: (demands) => demands.length,
    label: (
      <>
        demandes à affecter&nbsp;
        <Tooltip title="Demandes dont les tags gestionnaire et l'affectation n'ont pas encore été validés" />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-flag-fill" size="sm" color="red" />,
  },
} satisfies Record<string, QuickFilterPreset<DemandsListAdminItem>>;
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

const initialSortingState = [{ desc: true, id: 'Date de la demande' }];

const defaultAssignmentChipOption: ChipOption = {
  className: 'bg-gray-200 text-gray-900',
  key: 'Non affecté',
  label: 'Non affecté',
  title: '',
};

/**
 * Permet de savoir quand la table est rafraichie par un changement de valeur et donc de ne pas centrer la carte sur la première demande quand les demandes changent.
 */
let isUpdatingDemandField = false;

function DemandesAdmin(): React.ReactElement {
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>(null) as RefObject<Virtualizer<HTMLDivElement, Element>>;
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [filteredDemands, setFilteredDemands] = useState<DemandsListAdminItem[]>([]);

  const { data: demands = [], isLoading } = trpc.demands.admin.list.useQuery();
  const { data: assignmentRulesResults = [] } = useFetch<string[]>('/api/admin/assignment-rules/results');
  const assignmentRulesResultsOptions: ChipOption[] = useMemo(
    () => [
      ...assignmentRulesResults.map((rule) => ({
        key: rule,
        label: rule,
      })),
      defaultAssignmentChipOption,
    ],
    [assignmentRulesResults]
  );

  const presetStats = ObjectKeys(quickFilterPresets).reduce(
    (acc, key) => ({
      ...acc,
      [key]: quickFilterPresets[key].getStat(demands),
    }),
    {} as Record<QuickFilterPresetKey, number>
  );

  // Only reset selection if the filteredDemands array has changed in content, not just selectedDemandId.
  // Use usePrevious to keep track of the previous filteredDemands for comparison.
  const prevFilteredDemands = usePrevious(filteredDemands);

  useEffect(() => {
    if (!prevFilteredDemands) return;

    const hasOtherDemandChanged = filteredDemands.some((currDemand) => {
      if (currDemand.id === selectedDemandId) return false; // ignore selected
      const prevDemand = prevFilteredDemands.find((d) => d.id === currDemand.id);
      if (!prevDemand) return true; // new item appeared
      return JSON.stringify(currDemand) !== JSON.stringify(prevDemand); // changed content
    });

    const demandsLengthChanged = filteredDemands.length !== prevFilteredDemands.length;

    if (demandsLengthChanged || hasOtherDemandChanged) {
      setSelectedDemandId(null);
    }
  }, [filteredDemands, prevFilteredDemands, selectedDemandId]);

  const filteredDemandsMapData = useMemo(() => {
    return filteredDemands.map(
      (demand) =>
        ({
          address: demand.Adresse,
          id: demand.id,
          latitude: demand.Latitude ?? 0,
          longitude: demand.Longitude ?? 0,
          modeDeChauffage: displayModeDeChauffage(demand),
          selected: demand.id === selectedDemandId,
          typeDeLogement: demand.Structure,
        }) satisfies AdresseEligible
    );
  }, [filteredDemands, selectedDemandId]);

  const utils = trpc.useUtils();
  const { mutateAsync: updateDemandMutation } = trpc.demands.admin.update.useMutation();

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<DemandsListAdminItem>) => {
      isUpdatingDemandField = true; // prevent the map from being centered on the first demand
      utils.demands.admin.list.setData(undefined, (demands) =>
        (demands ?? []).map((demand) => {
          if (demand.id === demandId) {
            return { ...demand, ...demandUpdate };
          }
          return demand;
        })
      );
      await updateDemandMutation({ demandId, values: demandUpdate });
    }),
    [utils, updateDemandMutation]
  );

  const deleteDemand = useCallback(
    toastErrors(async (demandId: string) => {
      await deleteFetchJSON(`/api/admin/demands/${demandId}`);

      utils.demands.admin.list.setData(undefined, (demands) => (demands ?? []).filter((demand) => demand.id !== demandId));
      notify('success', 'Demande supprimée');
    }),
    [utils]
  );

  useMapEventBus('rdc-add-tag', (event) => {
    const selectedDemand = demands.find((demand: DemandsListAdminItem) => demand.id === selectedDemandId);
    if (!selectedDemandId || !selectedDemand) {
      notify('error', 'Aucune demande n‘est sélectionnée');
      return;
    }
    const currentTags = selectedDemand.Gestionnaires === null ? selectedDemand.recommendedTags : (selectedDemand.Gestionnaires ?? []);

    void updateDemand(selectedDemandId, {
      Gestionnaires: [...new Set([...currentTags, event.tag])],
    });
  });

  const tableColumns: ColumnDef<DemandsListAdminItem>[] = useMemo(
    () => [
      {
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
        header: '',
        id: 'indicators',
        width: '46px',
      },
      {
        accessorKey: 'Gestionnaires',
        cell: (info) => {
          const demand = info.row.original;

          return (
            <div className="block w-full">
              <FCUTagAutocomplete
                value={demand.Gestionnaires}
                onChange={(newGestionnaires: string[] | null /* TODO should be handled by typescript */) => {
                  void updateDemand(demand.id, {
                    Gestionnaires: newGestionnaires as string[],
                  });
                }}
                multiple
                suggestedValue={demand.recommendedTags}
              />
              <div className="flex items-center gap-2" onClick={stopPropagation} onDoubleClick={stopPropagation}>
                <EligibilityHelpDialog detailedEligibilityStatus={demand.detailedEligibilityStatus as DetailedEligibilityStatus}>
                  <Button
                    className="text-gray-700! font-normal! italic"
                    title="Voir le détail de l'éligibilité"
                    priority="tertiary no outline"
                    size="small"
                  >
                    {eligibilityTitleByType[demand.detailedEligibilityStatus.type]}
                  </Button>
                </EligibilityHelpDialog>
              </div>
              <div className="my-1">
                {demand.detailedEligibilityStatus.type !== 'trop_eloigne' &&
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
        enableSorting: false,
        header: 'Gestionnaires',
        width: '400px',
      },
      {
        accessorKey: 'Affecté à',
        cell: (info) => {
          const demand = info.row.original;
          return (
            <ChipAutoComplete
              options={assignmentRulesResultsOptions}
              defaultOption={defaultAssignmentChipOption}
              value={demand['Affecté à']}
              onChange={(value) => updateDemand(demand.id, { 'Affecté à': value || (null as any) })} // null allows a truly empty field (not an empty tag)
              suggestedValue={demand.recommendedAssignment}
            />
          );
        },
        enableSorting: false,
        header: 'Affecté à',
        width: '200px',
      },
      {
        accessorKey: 'Gestionnaires validés',
        align: 'center',
        cell: (info) => {
          const demand = info.row.original;
          return demand['Gestionnaires validés'] ? (
            <span className="text-green-500 text-3xl">✓</span>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <AsyncButton
                priority="primary"
                size="small"
                onClick={async () => {
                  void updateDemand(demand.id, {
                    'Affecté à': demand['Affecté à'] === null ? demand.recommendedAssignment : demand['Affecté à'],
                    'Distance au réseau':
                      demand['Distance au réseau'] === null ? demand.detailedEligibilityStatus.distance : demand['Distance au réseau'],

                    // assign recommended tags, assignment, and network infos if not are set
                    Gestionnaires: demand.Gestionnaires === null ? demand.recommendedTags : (demand.Gestionnaires ?? []),
                    'Gestionnaires validés': true,
                    'Identifiant réseau':
                      demand['Identifiant réseau'] === null ? demand.detailedEligibilityStatus.id_sncu : demand['Identifiant réseau'],
                    'Nom réseau': demand['Nom réseau'] === null ? demand.detailedEligibilityStatus.nom : demand['Nom réseau'],
                    'Relance à activer': demand.detailedEligibilityStatus.distance < 200 && demand['Type de chauffage'] === 'Collectif',
                  });
                }}
              >
                Valider
              </AsyncButton>
              <AsyncButton
                priority="secondary"
                size="small"
                iconId="fr-icon-delete-line"
                variant="destructive"
                title="Supprimer la demande"
                onClick={async () => {
                  if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
                    return;
                  }
                  await deleteDemand(demand.id);
                }}
              />
            </div>
          );
        },
        enableSorting: false,
        header: 'Gestionnaire validé',
        width: '120px',
      },
      {
        accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
        cell: ({ row }) => <Contact demand={row.original as unknown as Demand} onEmailClick={() => {}} />,
        enableSorting: false,
        header: 'Contact',
        width: '280px',
      },
      {
        accessorKey: 'Structure',
        cell: ({ row }) => <Tag text={row.original.Structure} />,
        enableGlobalFilter: false,
        enableSorting: false,
        header: 'Type',
        width: '130px',
      },
      {
        accessorFn: (row) => displayModeDeChauffage(row),
        cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
        enableGlobalFilter: false,
        enableSorting: false,
        header: 'Mode de chauffage',
        width: '134px',
      },
      {
        accessorKey: 'Adresse',
        cell: ({ row }) => <div className="whitespace-normal">{row.original.Adresse}</div>,
        enableSorting: false,
        header: 'Adresse',
        width: '220px',
      },
      {
        accessorKey: 'Date de la demande',
        cellType: 'DateTime',
        enableGlobalFilter: false,
        header: 'Date de la demande',
        width: '94px',
      },
      {
        accessorKey: 'Distance au réseau',
        cell: (info) => {
          const demand = info.row.original;
          return (
            <TableFieldInput
              type="number"
              title="Distance au réseau"
              value={demand['Distance au réseau']}
              onChange={(value) => updateDemand(demand.id, { 'Distance au réseau': value })}
              suggestedValue={demand.detailedEligibilityStatus.distance}
            />
          );
        },
        enableGlobalFilter: false,
        enableSorting: false,
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
        width: '120px',
      },
      {
        accessorKey: 'Identifiant réseau',
        cell: (info) => {
          const demand = info.row.original;
          return (
            <TableFieldInput
              title="Identifiant réseau"
              value={demand['Identifiant réseau']}
              onChange={(value) => updateDemand(demand.id, { 'Identifiant réseau': value })}
              suggestedValue={demand.detailedEligibilityStatus.id_sncu}
            />
          );
        },
        enableSorting: false,
        header: 'ID réseau le plus proche',
        width: '85px',
      },
      {
        accessorKey: 'Nom réseau',
        cell: (info) => {
          const demand = info.row.original;
          return (
            <TableFieldInput
              title="Nom du réseau"
              value={demand['Nom réseau']}
              onChange={(value) => updateDemand(demand.id, { 'Nom réseau': value })}
              suggestedValue={demand.detailedEligibilityStatus.nom}
            />
          );
        },
        enableSorting: false,
        header: 'Nom du réseau le plus proche',
        width: '250px',
      },
      {
        accessorKey: 'Logement',
        cell: (info) => info.getValue<number>() && <>{info.getValue<number>()}&nbsp;</>,
        enableGlobalFilter: false,
        enableSorting: false,
        header: 'Nb logements (lots)',
        width: '120px',
      },
      {
        accessorKey: 'Surface en m2',
        cell: (info) => info.getValue<number>() && <>{info.getValue<number>()}&nbsp;m²</>,
        enableGlobalFilter: false,
        enableSorting: false,
        header: 'Surface en m2',
        width: '120px',
      },
      {
        accessorKey: 'Conso',
        cell: (info) => info.getValue<number>() && formatMWh(info.getValue<number>()),
        enableGlobalFilter: false,
        enableSorting: false,
        header: 'Conso gaz (MWh)',
        width: '120px',
      },
      {
        accessorKey: 'Recontacté par le gestionnaire',
        cellType: 'Boolean',
        header: 'Recontacté par le gestionnaire',
        width: '280px',
      },
      {
        accessorKey: 'Commentaire relance',
        header: 'Commentaire relance',
        width: '280px',
      },
      {
        accessorKey: 'Commentaire',
        header: 'Commentaire',
        width: '280px',
      },
      {
        accessorKey: 'Commentaires_internes_FCU',
        cell: ({ row }) => (
          <Comment demand={row.original as unknown as Demand} field="Commentaires_internes_FCU" updateDemand={updateDemand} />
        ),
        enableSorting: false,
        header: 'Commentaires internes FCU',
        width: '280px',
      },
      {
        accessorKey: 'Sondage',
        cellType: 'Array',
        filterType: 'Facets',
      },
    ],
    [updateDemand, assignmentRulesResultsOptions]
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

  const selectAndCenterOnDemand = useCallback(
    (demandId: string, zoom: number) => {
      setSelectedDemandId(demandId);
      const selectedDemand = demands.find((demand: DemandsListAdminItem) => demand.id === demandId);
      if (selectedDemand) {
        setMapCenterLocation({
          center: [selectedDemand.Longitude ?? 0, selectedDemand.Latitude ?? 0],
          flyTo: true,
          zoom,
        });
      }
    },
    [demands]
  );
  const onTableRowClick = useCallback(
    (demandId: string) => {
      selectAndCenterOnDemand(demandId, 13);
    },
    [selectAndCenterOnDemand]
  );
  const onTableRowDoubleClick = useCallback(
    (demandId: string) => {
      selectAndCenterOnDemand(demandId, 16);
    },
    [selectAndCenterOnDemand]
  );

  const onTableFiltersChange = useCallback((demands: DemandsListAdminItem[]) => {
    setFilteredDemands(demands);

    // center on the first demand if any
    const firstDemand = demands[0];
    if (firstDemand && !isUpdatingDemandField) {
      setMapCenterLocation({
        center: [firstDemand.Longitude ?? 0, firstDemand.Latitude ?? 0],
        flyTo: true,
        zoom: 8,
      });
    }
    isUpdatingDemandField = false;
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
              onChange: (e) => setGlobalFilter(e.target.value),
              placeholder: 'Rechercher par nom, email, adresse...',
              required: true,
              value: globalFilter,
            }}
            className="p-2w mb-0! w-[350px]"
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
              onRowDoubleClick={onTableRowDoubleClick}
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
              ) : isLoading ? (
                <div className="absolute inset-0 flex justify-center items-center animate-pulse">
                  <Loader size="lg" />
                </div>
              ) : null}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SimplePage>
  );
}

export default DemandesAdmin;

export const getServerSideProps = withAuthentication(['admin']);
