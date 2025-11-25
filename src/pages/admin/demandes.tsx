import Badge from '@codegouvfr/react-dsfr/Badge';
import { usePrevious } from '@react-hookz/web';
import type { ColumnFiltersState } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import dynamic from 'next/dynamic';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre';
import TableFieldInput from '@/components/Admin/TableFieldInput';
import EligibilityHelpDialog from '@/components/EligibilityHelpDialog';
import Input from '@/components/form/dsfr/Input';
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';
import DemandEmailForm from '@/components/Manager/DemandEmailForm';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { useMapEventBus } from '@/components/Map/layers/common';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import FCUBadge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ChipAutoComplete, { type ChipOption } from '@/components/ui/ChipAutoComplete';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { useFetch } from '@/hooks/useApi';
import Comment from '@/modules/demands/client/Comment';
import Contact from '@/modules/demands/client/Contact';
import Contacted from '@/modules/demands/client/Contacted';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import Status from '@/modules/demands/client/Status';
import type { DemandStatus } from '@/modules/demands/constants';
import { eligibilityTypes as eligibilityCases, eligibilityTitleByType } from '@/modules/demands/constants';
import type { Demand } from '@/modules/demands/types';
import { notify, toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { withAuthentication } from '@/server/authentication';
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { stopPropagation } from '@/utils/events';
import { formatMWh, upperCaseFirstChar } from '@/utils/strings';

type DemandsListAdminData = RouterOutput['demands']['admin']['list'];
type DemandsListAdminItem = DemandsListAdminData['items'][number];

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

// biome-ignore assist/source/useSortedKeys: keep field order as more coherent with most used actions
const quickFilterPresets = {
  demandesAAffecter: {
    // @ts-expect-error: Typescript instantiation is too deep error
    filters: [{ id: 'Gestionnaires validés', value: { false: true, true: false } }],
    getStat: (demands) => demands.filter((demand) => !demand['Gestionnaires validés']).length,
    label: (
      <>
        demandes à affecter&nbsp;
        <Tooltip title="Demandes dont les tags gestionnaire et l'affectation n'ont pas encore été validés" />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-flag-fill" size="sm" color="red" />,
  },
  demandesATraiter: {
    filters: [
      { id: 'Status', value: { 'En attente de prise en charge': true } },
      { id: 'Prise de contact', value: { false: true, true: false } },
      {
        id: 'testAddress_eligibility_type' as any, // Filters do not support nested filters
        value: Object.fromEntries(
          eligibilityCases.map((eligibilityCase) => [eligibilityCase.type, eligibilityCase.type !== 'trop_eloigne'])
        ),
      },
    ],
    getStat: (demands) =>
      demands.filter(
        (demand) =>
          demand.Status === 'En attente de prise en charge' &&
          !demand['Prise de contact'] &&
          demand.testAddress.eligibility?.type !== 'trop_eloigne'
      ).length,
    label: (
      <>
        demandes en attente
        <br />
        de prise en charge&nbsp;
        <Tooltip
          title={`Le statut est "en attente de prise en charge", la case "prospect recontacté" n'est pas cochée et l'adresse n'est pas trop éloignée d'un réseau. La colonne "Affecté à" du tableau indique le gestionnaire à qui la demande a été transmise pour traitement.`}
        />
      </>
    ),
  },
  demandesDansPDP: {
    filters: [
      {
        id: 'en PDP',
        value: { Non: false, Oui: true },
      },
    ],
    getStat: (demands) => demands.filter((demand) => demand['en PDP'] === 'Oui').length,
    label: (
      <>
        demandes en PDP&nbsp;
        <Tooltip
          title={
            <>
              Périmètre de développement prioritaire (PDP) d'un réseau classé, dans lequel peut s'appliquer une obligation de raccordement.{' '}
              <Link href="/ressources/obligations-raccordement#contenu" isExternal>
                En savoir plus
              </Link>
            </>
          }
        />
      </>
    ),
    valueSuffix: <FCUBadge type="pdp" />,
  },
  all: {
    filters: [],
    getStat: (demands) => demands.length,
    label: 'demandes totales',
  },
} satisfies Record<string, QuickFilterPreset<DemandsListAdminItem>>;

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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(quickFilterPresets.demandesAAffecter.filters);
  const [modalDemand, setModalDemand] = useState<DemandsListAdminItem | null>(null);

  const { data: demandsData, isLoading } = trpc.demands.admin.list.useQuery();
  const demands = demandsData?.items ?? [];
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
  const { mutateAsync: deleteDemandMutation } = trpc.demands.admin.delete.useMutation();

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<DemandsListAdminItem>) => {
      isUpdatingDemandField = true; // prevent the map from being centered on the first demand
      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count,
          items: demandsData.items.map((demand) => {
            if (demand.id === demandId) {
              return { ...demand, ...demandUpdate };
            }
            return demand;
          }),
        };
      });
      await updateDemandMutation({ demandId, values: demandUpdate });
    }),
    [utils, updateDemandMutation]
  );

  const deleteDemand = useCallback(
    toastErrors(async (demandId: string) => {
      await deleteDemandMutation({ demandId });

      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count - 1,
          items: demandsData.items.filter((demand) => demand.id !== demandId),
        };
      });
      notify('success', 'Demande supprimée');
    }),
    [utils, deleteDemandMutation]
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
            {row.original.haut_potentiel && <FCUBadge type="haut_potentiel" />}
          </div>
        ),
        header: '',
        id: 'indicators',
        width: '46px',
      },
      {
        accessorKey: 'Status',
        cell: ({ row }) => {
          const demand = row.original;
          return (
            <div>
              <Status demand={row.original as unknown as Demand} updateDemand={updateDemand} disabled={true} className="mb-0!" />
              <div className="" onClick={stopPropagation} onDoubleClick={stopPropagation}>
                <EligibilityHelpDialog detailedEligibilityStatus={demand.testAddress.eligibility} tags={demand.recommendedTags}>
                  <Button
                    className="text-gray-700! font-normal! italic"
                    title="Voir le détail de l'éligibilité"
                    priority="tertiary no outline"
                    size="small"
                    iconId="fr-icon-info-line"
                  >
                    {demand.testAddress.eligibility?.type ? eligibilityTitleByType[demand.testAddress.eligibility?.type] : 'Non connu'}
                  </Button>
                </EligibilityHelpDialog>
              </div>
            </div>
          );
        },
        enableGlobalFilter: false,
        filterProps: {
          Component: ({ value }) => <DemandStatusBadge status={value as DemandStatus} />,
        },
        filterType: 'Facets',
        header: 'Statut',
        width: '290px',
      },
      {
        accessorKey: 'Prise de contact',
        align: 'center',
        cell: ({ row }) => <Contacted demand={row.original as unknown as Demand} updateDemand={updateDemand} />,
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Prospect recontacté',
        width: '85px',
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

              {/* <div className="my-1">
                {demand.detailedEligibilityStatus.type !== 'trop_eloigne' &&
                  !demand.detailedEligibilityStatus?.communes?.includes(demand.detailedEligibilityStatus.commune.nom!) && (
                    <Badge
                      type="warning_ville_differente"
                      title={`La ville de la demande (${demand.detailedEligibilityStatus.commune.nom!}) ne correspond pas à ${demand.detailedEligibilityStatus.communes.length > 1 ? 'aux villes' : 'la ville'} du réseau (${demand.detailedEligibilityStatus.communes.join(', ')})`}
                    />
                  )}
              </div> */}
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
            <div>
              <ChipAutoComplete
                options={assignmentRulesResultsOptions}
                defaultOption={defaultAssignmentChipOption}
                value={demand['Affecté à']}
                onChange={(value) => updateDemand(demand.id, { 'Affecté à': value || (null as any) })} // null allows a truly empty field (not an empty tag)
                suggestedValue={demand.recommendedAssignment}
              />
              {demand['Gestionnaire Affecté à'] && demand['Gestionnaire Affecté à'] !== demand['Affecté à'] && (
                <div className="text-xs text-warning">
                  Demande de changement d'affectation: <strong>{demand['Gestionnaire Affecté à']}</strong>
                </div>
              )}
            </div>
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
                      demand['Distance au réseau'] === null ? demand.testAddress.eligibility?.distance : demand['Distance au réseau'],

                    // assign recommended tags, assignment, and network infos if not are set
                    Gestionnaires: demand.Gestionnaires === null ? demand.recommendedTags : (demand.Gestionnaires ?? []),
                    'Gestionnaires validés': true,
                    'Identifiant réseau':
                      demand['Identifiant réseau'] === null ? demand.testAddress.eligibility?.id_sncu : demand['Identifiant réseau'],
                    'Nom réseau': demand['Nom réseau'] === null ? demand.testAddress.eligibility?.nom : demand['Nom réseau'],
                    'Relance à activer':
                      (demand.testAddress.eligibility?.distance || 999999) < 200 && demand['Type de chauffage'] === 'Collectif',
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
        filterType: 'Facets',
        header: 'Gestionnaire validé',
        width: '120px',
      },
      {
        accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
        cell: ({ row }) => <Contact demand={row.original as unknown as Demand} onEmailClick={() => setModalDemand(row.original)} />,
        enableSorting: false,
        header: 'Contact',
        width: '280px',
      },
      {
        accessorKey: 'Structure',
        cell: ({ row }) => <Tag text={row.original.Structure} />,
        enableGlobalFilter: false,
        enableSorting: false,
        filterType: 'Facets',
        header: 'Type',
        width: '130px',
      },
      {
        accessorFn: (row) => displayModeDeChauffage(row),
        cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
        enableGlobalFilter: false,
        enableSorting: false,
        filterType: 'Facets',
        header: 'Mode de chauffage',
        width: '134px',
      },
      {
        accessorKey: 'testAddress.ban_address',
        cell: (info) => {
          const demand = info.row.original;
          const testAddress = demand.testAddress;
          return (
            <div>
              <div>
                <div className="leading-none tracking-tight">{testAddress.ban_address}</div>
                {!testAddress.ban_valid && (
                  <Badge severity="error" small>
                    Adresse invalide
                  </Badge>
                )}
                {demand['en PDP'] === 'Oui' && <FCUBadge type="pdp" />}
              </div>
              {testAddress.source_address !== testAddress.ban_address && (
                <div className="text-xs italic text-gray-400 tracking-tighter">{testAddress.source_address}</div>
              )}
              {(demand.Logement || demand['Surface en m2'] || demand.Conso) && <div className="border-t border-gray-600 my-2" />}
              {demand.Logement && <div className="text-xs font-bold">{demand.Logement} logements</div>}
              {demand['Surface en m2'] && <div className="text-xs font-bold">{demand['Surface en m2']}m²</div>}
              {demand.Conso && <div className="text-xs font-bold">{formatMWh(demand.Conso)} de gaz</div>}
            </div>
          );
        },
        enableSorting: false,
        header: 'Adresse',
        width: '240px',
      },
      {
        accessorKey: 'Date de la demande',
        cellType: 'DateTime',
        enableGlobalFilter: false,
        header: 'Date de la demande',
        width: '94px',
      },
      {
        accessorKey: 'Identifiant réseau',
        cell: (info) => {
          const demand = info.row.original;
          const testAddress = demand.testAddress;
          return (
            <div className="flex items-start gap-2 flex-col justify-start">
              <TableFieldInput
                title="Identifiant réseau"
                value={demand['Identifiant réseau']}
                onChange={(value) => updateDemand(demand.id, { 'Identifiant réseau': value })}
                suggestedValue={testAddress.eligibility?.id_sncu ?? undefined}
              />
              {(testAddress.eligibility?.nom || (testAddress.eligibility?.distance && testAddress.eligibility?.distance > 0)) && (
                <div className="text-xs text-gray-500">
                  <strong>{testAddress.eligibility?.distance}m</strong> de {testAddress.eligibility?.nom}
                </div>
              )}
            </div>
          );
        },
        enableSorting: false,
        header: 'ID réseau le plus proche',
        width: '200px',
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
        cell: ({ row }) => <Comment demand={row.original} field="Commentaires_internes_FCU" updateDemand={updateDemand} />,
        enableSorting: false,
        header: 'Commentaires internes FCU',
        width: '280px',
      },
      {
        accessorKey: 'Sondage',
        cellType: 'Array',
        filterType: 'Facets',
      },
      {
        accessorKey: 'en PDP',
        filterType: 'Facets', // obligatoire pour faire fonctionner le filtre
        visible: false,
      },
      {
        accessorKey: 'testAddress.eligibility.type',
        filterType: 'Facets', // obligatoire pour faire fonctionner le filtre
        visible: false,
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
      <ModalSimple
        title={`Envoi d'un courriel à ${modalDemand?.Mail}`}
        open={!!modalDemand}
        size="large"
        onOpenChange={(open) => !open && setModalDemand(null)}
      >
        {modalDemand && <DemandEmailForm currentDemand={modalDemand as unknown as Demand} updateDemand={updateDemand} />}
      </ModalSimple>
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
          <QuickFilterPresets
            presets={quickFilterPresets}
            data={demands}
            loading={isLoading}
            columnFilters={columnFilters}
            onFiltersChange={setColumnFilters}
          />
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
              columnFilters={columnFilters}
              rowSelection={tableRowSelection}
              onRowClick={onTableRowClick}
              onRowDoubleClick={onTableRowDoubleClick}
              loadingEmptyMessage="Aucune demande à afficher"
              height="calc(100dvh - 164px)"
              virtualizerRef={virtualizerRef}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={34}>
            <div className={cx('max-md:h-[600px] md:h-[calc(100dvh-164px)] bg-[#F8F4F0]')}>
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
