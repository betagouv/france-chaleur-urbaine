import DSFRBadge from '@codegouvfr/react-dsfr/Badge';
import DSFRTag from '@codegouvfr/react-dsfr/Tag';
import { usePrevious } from '@react-hookz/web';
import type { ColumnFiltersState } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import dynamic from 'next/dynamic';
import { parseAsJson, useQueryState } from 'nuqs';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre';

import TableAddressAutocomplete from '@/components/Admin/TableAddressAutocomplete';
import EligibilityHelpDialog from '@/components/EligibilityHelpDialog';
import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import DemandEmailForm from '@/components/Manager/DemandEmailForm';
import ModeDeChauffageTag, { getModeDeChauffageDisplay } from '@/components/Manager/ModeDeChauffageTag';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { reseauDeChaleurNonClasseColor } from '@/components/Map/layers/reseauxDeChaleur';
import { reseauxEnConstructionColor } from '@/components/Map/layers/reseauxEnConstruction';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import FCUBadge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import HamburgerMenu, { type HamburgerMenuItem } from '@/components/ui/HamburgerMenu';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import Comment from '@/modules/demands/client/Comment';
import Contact from '@/modules/demands/client/Contact';
import Contacted from '@/modules/demands/client/Contacted';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import Status from '@/modules/demands/client/Status';
import type { DemandStatus } from '@/modules/demands/constants';
import { eligibilityTypes as eligibilityCases, eligibilityTitleByType } from '@/modules/demands/constants';
import type { Demand } from '@/modules/demands/types';
import { notify, toastErrors } from '@/modules/notification';
import EligibilityHistoryTooltip from '@/modules/pro-eligibility-tests/client/EligibilityHistoryTooltip';
import type { NetworkType } from '@/modules/reseaux/constants';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { withAuthentication } from '@/server/authentication';
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { dayjs } from '@/utils/date';
import { stopPropagation } from '@/utils/events';

type DemandsListAdminData = RouterOutput['demands']['admin']['list'];
type DemandsListAdminItem = DemandsListAdminData['items'][number];

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

// biome-ignore assist/source/useSortedKeys: keep field order as more coherent with most used actions
const quickFilterPresets = {
  demandesMoisEnCours: {
    filters: [
      {
        id: 'Date de la demande',
        value: [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().endOf('month').format('YYYY-MM-DD'), false],
      },
    ],
    getStat: (demands) => {
      return demands.filter((demand) => {
        const demandDate = dayjs(demand['Date de la demande']);
        return demandDate.isSame(dayjs(), 'month');
      }).length;
    },
    label: `en ${dayjs().format('MMMM')}`,
  },
  demandesAAffecter: {
    filters: [{ id: 'validated', value: { false: true, true: false } }],
    getStat: (demands) => demands.filter((demand) => !demand.validated).length,
    label: (
      <>
        à valider&nbsp;
        <Tooltip title="Demandes dont l'affectation réseau n'a pas encore été validée" />
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
        en attente
        <br />
        de prise en charge&nbsp;
        <Tooltip
          title={`Le statut est "en attente de prise en charge", la case "prospect recontacté" n'est pas cochée et l'adresse n'est pas trop éloignée d'un réseau.`}
        />
      </>
    ),
  },

  all: {
    filters: [],
    getStat: (demands) => demands.length,
    label: 'demandes totales',
  },
} satisfies Record<string, QuickFilterPreset<DemandsListAdminItem>>;

const initialSortingState = [{ desc: true, id: 'Date de la demande' }];

/**
 * Permet de savoir quand la table est rafraichie par un changement de valeur et donc de ne pas centrer la carte sur la première demande quand les demandes changent.
 */
let isUpdatingDemandField = false;

const demandsTableUrlSyncKey = 'demands';

function DemandesAdmin(): React.ReactElement {
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>(null) as RefObject<Virtualizer<HTMLDivElement, Element>>;
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [filteredDemands, setFilteredDemands] = useState<DemandsListAdminItem[]>([]);

  // Pour le moment, si l'URL contient les filtres, on applique pas les presets.
  const [urlColumnFilters] = useQueryState(
    `${demandsTableUrlSyncKey}_filters`,
    parseAsJson<ColumnFiltersState>((value) => value as ColumnFiltersState)
  );
  const initialColumnFilters = urlColumnFilters !== null ? [] : quickFilterPresets.demandesAAffecter.filters;
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters);
  const [modalDemand, setModalDemand] = useState<DemandsListAdminItem | null>(null);

  const { data: demandsData, isLoading } = trpc.demands.admin.list.useQuery();
  const demands = demandsData?.items ?? [];

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
          modeDeChauffage:
            getModeDeChauffageDisplay({
              modeDeChauffage: demand['Mode de chauffage'],
              typeDeChauffage: demand['Type de chauffage'],
            }) ?? undefined,
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

      // Convert null to undefined for fields that don't accept null
      const sanitizedUpdate = Object.fromEntries(
        Object.entries(demandUpdate).map(([key, value]) => [key, value === null ? undefined : value])
      );

      await updateDemandMutation({ demandId, values: sanitizedUpdate });
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

  const { mutateAsync: validateDemandMutation } = trpc.demands.admin.validate.useMutation();
  const { mutateAsync: unvalidateDemandMutation } = trpc.demands.admin.unvalidate.useMutation();
  const { mutateAsync: changeNetworkMutation } = trpc.demands.admin.changeNetwork.useMutation();

  const changeNetwork = useCallback(
    toastErrors(async (demandId: string, networkIdFcu: number | null, networkType: NetworkType | null, networkName: string | null) => {
      isUpdatingDemandField = true;
      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count,
          items: demandsData.items.map((demand) => {
            if (demand.id === demandId) {
              return { ...demand, network_id: networkIdFcu, network_name: networkName, network_type: networkType, validated: false };
            }
            return demand;
          }),
        };
      });
      await changeNetworkMutation({ demandId, networkIdFcu, networkType });
    }),
    [utils, changeNetworkMutation]
  );

  const validateDemand = useCallback(
    toastErrors(async (demandId: string) => {
      isUpdatingDemandField = true;
      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count,
          items: demandsData.items.map((demand) => {
            if (demand.id === demandId) {
              return { ...demand, validated: true };
            }
            return demand;
          }),
        };
      });
      await validateDemandMutation({ demandId });
    }),
    [utils, validateDemandMutation]
  );

  const unvalidateDemand = useCallback(
    toastErrors(async (demandId: string) => {
      isUpdatingDemandField = true;
      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count,
          items: demandsData.items.map((demand) => {
            if (demand.id === demandId) {
              return { ...demand, validated: false };
            }
            return demand;
          }),
        };
      });
      await unvalidateDemandMutation({ demandId });
    }),
    [utils, unvalidateDemandMutation]
  );

  const tableColumns: ColumnDef<DemandsListAdminItem>[] = useMemo(
    () => [
      {
        align: 'center',
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {!row.original.validated && (
              <Tooltip title="Cette demande n'a pas encore été validée">
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
                <EligibilityHelpDialog detailedEligibilityStatus={demand.testAddress.eligibility}>
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
        width: '110px',
      },
      {
        accessorKey: 'Recontacté par le gestionnaire',
        align: 'center',
        cell: ({ row }) => (
          <Select
            label=""
            options={[
              { label: 'Non renseigné', value: '' },
              { label: 'Oui', value: 'Oui' },
              { label: 'Non', value: 'Non' },
            ]}
            size="sm"
            nativeSelectProps={{
              'aria-label': 'Recontacté par le gestionnaire',
              onChange: (e) =>
                updateDemand(row.original.id, {
                  'Recontacté par le gestionnaire': e.target.value,
                }),
              value: row.original['Recontacté par le gestionnaire'] || '',
            }}
          />
        ),
        filterType: 'Facets',
        header: () => (
          <>
            Recontacté par
            <br />
            le gestionnaire
          </>
        ),
        width: '155px',
      },
      {
        accessorFn: (row) => ((row as any).network_tags ?? []).join(', '),
        cell: ({ row }) => {
          const tags = (row.original as any).network_tags as string[] | null;
          if (!tags || tags.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-0.5">
              {tags.map((tag) => (
                <DSFRTag key={tag} small className="text-[10px]!">
                  {tag}
                </DSFRTag>
              ))}
            </div>
          );
        },
        enableSorting: false,
        header: 'Tags réseau',
        id: 'network_tags',
        width: '160px',
      },
      {
        accessorFn: (row) => row.network_name ?? '',
        cell: ({ row }) => {
          const demand = row.original;
          return (
            <div className="flex flex-col gap-1 w-full" onClick={stopPropagation} onDoubleClick={stopPropagation}>
              <NetworkDisplay demand={demand} onNetworkChange={changeNetwork} onValidate={validateDemand} onUnvalidate={unvalidateDemand} />
            </div>
          );
        },
        enableSorting: false,
        filterType: 'Facets',
        header: 'Réseau affecté',
        id: 'network_name',
        width: '300px',
      },
      {
        accessorKey: 'validated',
        filterType: 'Facets',
        header: 'Validé',
        visible: false,
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
        accessorFn: (row) =>
          getModeDeChauffageDisplay({
            modeDeChauffage: row['Mode de chauffage'],
            typeDeChauffage: row['Type de chauffage'],
          }),
        cell: ({ row }) => (
          <ModeDeChauffageTag modeDeChauffage={row.original['Mode de chauffage']} typeDeChauffage={row.original['Type de chauffage']} />
        ),
        enableGlobalFilter: false,
        enableSorting: false,
        filterType: 'Facets',
        header: 'Mode de chauffage',
        width: '134px',
      },
      {
        accessorKey: 'testAddress.ban_address',
        cell: (info) => <TableAddressAutocomplete demand={info.row.original} />,
        enableSorting: false,
        header: 'Adresse',
        width: '240px',
      },
      {
        accessorKey: 'Date de la demande',
        cellType: 'DateTime',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Date de la demande',
        width: '94px',
      },
      {
        accessorKey: 'testAddress.eligibility.id_sncu',
        filterType: 'Facets',
        header: 'Réseau le plus proche',
        visible: false,
      },
      {
        accessorKey: 'testAddress.eligibility_history',
        align: 'center',
        cell: ({ row }) => {
          const history = row.original.testAddress?.eligibility_history as any;
          if (!history || !Array.isArray(history) || history.length === 0) {
            return null;
          }
          return (
            <div className="flex items-center justify-center gap-1">
              <Tooltip title={<EligibilityHistoryTooltip history={history} />} side="left" />
            </div>
          );
        },
        enableSorting: false,
        header: () => 'Historique éligibilité',
        width: '100px',
      },
      {
        accessorKey: 'Commentaire relance',
        header: 'Commentaire relance',
        width: '280px',
      },
      {
        accessorKey: 'comment_gestionnaire',
        header: 'Commentaire Gestionnaire',
        width: '280px',
      },
      {
        accessorKey: 'comment_fcu',
        cell: ({ row }) => <Comment demand={row.original} field="comment_fcu" updateDemand={updateDemand} />,
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
      {
        accessorKey: 'departement_code',
        filtersDialogDescription: 'Filtrer par code département.',
        filtersDialogLabel: 'Département',
        filterType: 'Facets',
        header: 'Département',
        showInFiltersDialog: true,
        visible: false,
      },
      {
        accessorFn: (row) => (row.network_id ? `${row.network_type}:${row.network_id}` : null),
        filterType: 'Facets',
        header: 'network_id',
        id: 'network_id',
        visible: false,
      },
      {
        align: 'right' as const,
        cell: ({ row }) => <DemandActions demand={row.original} onDelete={deleteDemand} />,
        enableSorting: false,
        header: '',
        id: 'actions',
        width: '50px',
      },
    ],
    [updateDemand, changeNetwork, validateDemand, unvalidateDemand, deleteDemand]
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
        <ResizablePanelGroup orientation="horizontal" className="gap-4">
          <ResizablePanel defaultSize="66%">
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
              urlSyncKey={demandsTableUrlSyncKey}
            />
          </ResizablePanel>
          <ResizableSeparator />
          <ResizablePanel defaultSize="34%">
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

type NetworkChangeHandler = (
  demandId: string,
  networkIdFcu: number | null,
  networkType: NetworkType | null,
  networkName: string | null
) => void;

/**
 * Full network display cell matching ReseauxStatsPage presentation:
 * badges, network name dropdown, distance, tags, validate button, and change action in menu.
 */
function NetworkDisplay({
  demand,
  onNetworkChange,
  onValidate,
  onUnvalidate,
}: {
  demand: DemandsListAdminItem;
  onNetworkChange: NetworkChangeHandler;
  onValidate: (demandId: string) => Promise<void>;
  onUnvalidate: (demandId: string) => Promise<void>;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (!demand.network_name) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 italic text-sm whitespace-nowrap">Non affecté</span>
        <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              priority="tertiary no outline"
              size="small"
              iconId="fr-icon-arrow-go-back-line"
              title="Affecter un réseau"
              className="shrink-0"
            />
          </PopoverTrigger>
          <NetworkSearchPopoverContent demand={demand} onNetworkChange={onNetworkChange} setIsOpen={setIsSearchOpen} />
        </Popover>
      </div>
    );
  }

  const isExistant = demand.network_type === 'existant';
  const distance = demand.testAddress?.eligibility?.distance;

  const networkMenuItems: HamburgerMenuItem[] = [
    ...(demand.network_sncu_id
      ? [
          {
            href: `/reseaux/${demand.network_sncu_id}`,
            icon: 'fr-icon-road-map-line' as const,
            id: 'fiche-reseau',
            label: 'Fiche réseau',
            target: '_blank',
          },
        ]
      : []),
    {
      href: `/admin/reseaux/stats?reseaux_filters=${encodeURIComponent(JSON.stringify([{ id: 'reseau', value: demand.network_name }]))}`,
      icon: 'fr-icon-bar-chart-box-line' as const,
      id: 'stats-reseau',
      label: 'Statistiques du réseau',
      target: '_blank' as const,
    },
    {
      icon: 'fr-icon-arrow-go-back-line' as const,
      id: 'change-network',
      label: "Changer l'affectation",
      onClick: () => setIsSearchOpen(true),
      variant: 'warning' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Tooltip title={isExistant ? 'Réseau de chaleur existant' : 'Réseau de chaleur en construction'}>
          <DSFRBadge
            small
            className="text-white! cursor-help shrink-0"
            style={{ backgroundColor: isExistant ? reseauDeChaleurNonClasseColor : reseauxEnConstructionColor }}
          >
            {isExistant ? 'Existant' : 'En construction'}
          </DSFRBadge>
        </Tooltip>
        {demand.network_sncu_id && (
          <Tooltip title="Identifiant SNCU du réseau">
            <DSFRBadge small className="cursor-help shrink-0">
              {demand.network_sncu_id}
            </DSFRBadge>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-1">
        <HamburgerMenu
          items={networkMenuItems}
          trigger={
            <button type="button" className="text-sm font-semibold leading-snug text-left hover:underline cursor-pointer">
              {demand.network_name}
            </button>
          }
        />
        {demand.validated ? (
          <AsyncButton
            priority="tertiary no outline"
            size="small"
            iconId="fr-icon-success-line"
            className=""
            title="Affectation validée — cliquer pour dévalider"
            onClick={() => onUnvalidate(demand.id)}
          />
        ) : (
          <AsyncButton
            priority="tertiary no outline"
            size="small"
            iconId="fr-icon-checkbox-circle-line"
            className=""
            title="Valider l'affectation"
            onClick={() => onValidate(demand.id)}
          />
        )}
      </div>

      {distance != null && distance > 0 && <span className="text-xs text-gray-500">{distance}m</span>}
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <PopoverTrigger asChild>
          <span className="sr-only" />
        </PopoverTrigger>
        <NetworkSearchPopoverContent demand={demand} onNetworkChange={onNetworkChange} setIsOpen={setIsSearchOpen} />
      </Popover>
    </div>
  );
}

/**
 * Inner content of the network search popover — reused with different triggers.
 */
function NetworkSearchPopoverContent({
  demand,
  onNetworkChange,
  setIsOpen,
}: {
  demand: DemandsListAdminItem;
  onNetworkChange: NetworkChangeHandler;
  setIsOpen: (open: boolean) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, []);

  const { data: searchResults, isFetching } = trpc.reseaux.searchNetworks.useQuery(
    { search: debouncedSearch },
    { enabled: debouncedSearch.length >= 2 }
  );

  const handleSelect = (result: { id_fcu: number; nom_reseau: string | null; network_type: NetworkType }) => {
    onNetworkChange(demand.id, result.id_fcu, result.network_type, result.nom_reseau);
    setIsOpen(false);
  };

  const handleUnassign = () => {
    onNetworkChange(demand.id, null, null, null);
    setIsOpen(false);
  };

  return (
    <PopoverContent className="w-80 p-0" align="start">
      <div className="p-2 border-b">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder="Rechercher un réseau..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <div className="max-h-60 overflow-y-auto">
        {isFetching && <div className="p-3 text-center text-sm text-gray-500">Recherche...</div>}
        {!isFetching && debouncedSearch.length >= 2 && searchResults?.length === 0 && (
          <div className="p-3 text-center text-sm text-gray-500">Aucun réseau trouvé</div>
        )}
        {!isFetching && debouncedSearch.length < 2 && debouncedSearch.length > 0 && (
          <div className="p-3 text-center text-sm text-gray-500">Tapez au moins 2 caractères</div>
        )}
        {searchResults?.map((result) => (
          <button
            key={`${result.network_type}:${result.id_fcu}`}
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
            onClick={() => handleSelect(result)}
          >
            <div className="font-medium">{result.nom_reseau || 'Sans nom'}</div>
            <div className="text-xs text-gray-500">
              {result.identifiant_reseau && <span>{result.identifiant_reseau} · </span>}
              {result.network_type === 'en_construction' ? 'En construction' : 'Existant'}
            </div>
          </button>
        ))}
      </div>
      {demand.network_id && (
        <div className="border-t p-2">
          <button
            type="button"
            className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer"
            onClick={handleUnassign}
          >
            Retirer l'affectation
          </button>
        </div>
      )}
    </PopoverContent>
  );
}

function DemandActions({ demand, onDelete }: { demand: DemandsListAdminItem; onDelete: (demandId: string) => Promise<void> }) {
  const utils = trpc.useUtils();
  const { mutateAsync: recalculateEligibility } = trpc.demands.admin.recalculateEligibility.useMutation();

  const menuItems: HamburgerMenuItem[] = [
    {
      href: `/admin/events?contextType=demand&contextId=${demand.id}`,
      icon: 'fr-icon-time-line',
      id: 'view-history',
      label: "Voir l'historique",
      target: '_blank',
    },
    {
      icon: 'fr-icon-refresh-line',
      id: 'recalculate-eligibility',
      label: "Recalculer l'éligibilité",
      onClick: toastErrors(async () => {
        const result = await recalculateEligibility({ demandId: demand.id });
        await utils.demands.admin.list.invalidate();

        notify('success', `${result.banAddress} — ${result.type}`);
      }),
    },
    {
      icon: 'fr-icon-delete-line',
      id: 'delete-demand',
      label: 'Supprimer la demande',
      onClick: async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
          return;
        }
        await onDelete(demand.id);
      },
      variant: 'destructive',
    },
  ];

  return <HamburgerMenu items={menuItems} />;
}

export const getServerSideProps = withAuthentication(['admin']);
