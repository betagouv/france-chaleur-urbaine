import type { ColumnFiltersState } from '@tanstack/react-table';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import DemandEmailModal from '@/components/Manager/DemandEmailModal';
import ModeDeChauffageTag, { getModeDeChauffageDisplay } from '@/components/Manager/ModeDeChauffageTag';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import AccessCountsCell from '@/modules/demands/client/AccessCountsCell';
import AdditionalInformation from '@/modules/demands/client/AdditionalInformation';
import AffectedNetworkCell from '@/modules/demands/client/AffectedNetworkCell';
import Comment from '@/modules/demands/client/Comment';
import Contact from '@/modules/demands/client/Contact';
import Contacted from '@/modules/demands/client/Contacted';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import Status from '@/modules/demands/client/Status';
import type { Demand } from '@/modules/demands/types';
import { toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { withAuthentication } from '@/server/authentication';
import { DEMANDE_STATUS, type DemandStatus } from '@/types/enum/DemandSatus';
import type { UserRole } from '@/types/enum/UserRole';
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import type { ExportColumn } from '@/utils/export';
import { pick } from '@/utils/objects';
import { ObjectKeys } from '@/utils/typescript';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });
const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

type DemandsList = RouterOutput['demands']['gestionnaire']['list'];
type DemandsListItem = DemandsList[number];

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

export const demandsExportColumns: ExportColumn<DemandsListItem>[] = [
  {
    accessorKey: 'Status',
    name: 'Statut',
  },
  {
    accessorFn: (demand) => (demand['Prise de contact'] ? 'Oui' : 'Non'),
    name: 'Prospect recontacté',
  },
  {
    accessorFn: (demand) => `${demand.Prénom ? demand.Prénom : ''} ${demand.Nom}`,
    name: 'Nom',
  },
  { accessorKey: 'Mail', name: 'Mail' },
  { accessorKey: 'Téléphone', name: 'Téléphone' },
  { accessorKey: 'Adresse', name: 'Adresse' },
  {
    accessorKey: 'en PDP',
    name: 'En PDP',
  },
  { accessorKey: 'Date de la demande', name: 'Date de demande' },
  { accessorKey: 'Structure', name: 'Type' },
  { accessorKey: 'Établissement', name: 'Structure' },
  {
    accessorKey: 'Mode de chauffage',
    name: 'Mode de chauffage',
  },
  {
    accessorKey: 'Type de chauffage',
    name: 'Type de chauffage',
  },
  {
    accessorFn: (demand) => demand.testAddress?.eligibility?.distance ?? '',
    name: 'Distance au réseau (m)',
  },
  {
    accessorFn: (demand) => demand.testAddress?.eligibility?.id_sncu,
    name: 'ID réseau le plus proche',
  },
  {
    accessorFn: (demand) => demand.testAddress?.eligibility?.nom,
    name: 'Nom du réseau le plus proche',
  },
  {
    accessorFn: (demand) => (demand['Gestionnaire Logement'] === undefined ? demand.Logement : demand['Gestionnaire Logement']) ?? 0,
    name: 'Nb logements',
  },
  {
    accessorKey: 'Surface en m2',
    name: 'Surface en m2',
  },
  {
    accessorFn: (demand) => (demand['Gestionnaire Conso'] === undefined ? demand.Conso : demand['Gestionnaire Conso']) ?? 0,
    name: 'Conso gaz (MWh)',
  },
  { accessorKey: 'comment_gestionnaire', name: 'Commentaires' },
  {
    accessorKey: 'Affecté à',
    name: 'Affecté à',
  },
  {
    accessorFn: (demand) => demand.access_counts.gestionnaire,
    name: 'Gestionnaires avec accès',
  },
  {
    accessorFn: (demand) => demand.access_counts.collectivite,
    name: 'Collectivités avec accès',
  },
  {
    accessorFn: (demand) => demand.access_counts.alec,
    name: 'ALEC avec accès',
  },
  {
    accessorFn: (demand) => demand.access_counts.ccrt,
    name: 'CCRT avec accès',
  },
  {
    accessorFn: (demand) => (demand.is_responsible ? 'Oui' : 'Non'),
    name: 'À traiter par moi',
  },
];

const traiteesStatusFilterValue: Record<DemandStatus, boolean> = {
  [DEMANDE_STATUS.EMPTY]: false,
  [DEMANDE_STATUS.UNREALISABLE]: true,
  [DEMANDE_STATUS.WAITING]: true,
  [DEMANDE_STATUS.IN_PROGRESS]: true,
  [DEMANDE_STATUS.VOTED]: true,
  [DEMANDE_STATUS.WORK_IN_PROGRESS]: true,
  [DEMANDE_STATUS.DONE]: true,
  [DEMANDE_STATUS.ABANDONNED]: true,
};

// biome-ignore assist/source/useSortedKeys: presets are intentionally ordered for UI priority
const allPresetDefinitions = {
  aTraiter: {
    filters: [
      { id: 'is_responsible', value: { false: false, true: true } },
      { id: 'Status', value: { [DEMANDE_STATUS.EMPTY]: true } },
      { id: 'Prise de contact', value: { false: true, true: false } },
    ],
    getStat: (demands) =>
      demands.filter((demand) => demand.is_responsible && demand.Status === DEMANDE_STATUS.EMPTY && !demand['Prise de contact']).length,
    label: (
      <>
        demandes à traiter&nbsp;
        <Tooltip title="Demandes que vous devez traiter en priorité : non encore prises en charge et relevant de votre périmètre." />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-flag-fill" size="sm" color="red" />,
  },
  traitees: {
    filters: [
      { id: 'is_responsible', value: { false: false, true: true } },
      { id: 'Status', value: traiteesStatusFilterValue },
    ],
    getStat: (demands) => demands.filter((demand) => demand.is_responsible && demand.Status !== DEMANDE_STATUS.EMPTY).length,
    label: (
      <>
        demandes traitées&nbsp;
        <Tooltip title="Demandes relevant de votre périmètre dont le statut a évolué." />
      </>
    ),
  },
  nonAffectees: {
    filters: [{ id: 'network_id', value: 'empty' }],
    getStat: (demands) => demands.filter((demand) => demand.network_id == null).length,
    label: (
      <>
        demandes non affectées&nbsp;
        <Tooltip title="Demandes sans réseau de chaleur affecté." />
      </>
    ),
  },
  nonRealisables: {
    filters: [{ id: 'Status', value: { [DEMANDE_STATUS.UNREALISABLE]: true } }],
    getStat: (demands) => demands.filter((demand) => demand.Status === DEMANDE_STATUS.UNREALISABLE).length,
    label: (
      <>
        demandes non réalisables&nbsp;
        <Tooltip title="Demandes dont le statut est « Non réalisable »." />
      </>
    ),
  },
  enPDP: {
    filters: [{ id: 'en PDP', value: { Non: false, Oui: true } }],
    getStat: (demands) => demands.filter((demand) => demand['en PDP'] === 'Oui').length,
    label: (
      <>
        demandes en PDP&nbsp;
        <Tooltip title="Demandes situées dans un périmètre de développement prioritaire." />
      </>
    ),
  },
  all: {
    filters: [],
    getStat: (demands) => demands.length,
    label: 'demandes totales',
  },
} satisfies Record<string, QuickFilterPreset<DemandsListItem>>;

type PresetKey = keyof typeof allPresetDefinitions;

const allPresetKeys = ObjectKeys(allPresetDefinitions);

/**
 * Presets visibles par rôle (hors `aTraiter`, géré séparément via la permission réseau).
 */
const presetsByRole: Partial<Record<UserRole, PresetKey[]>> = {
  admin: ['all', 'nonRealisables', 'enPDP'],
  alec: ['all', 'nonAffectees', 'nonRealisables', 'enPDP'],
  ccrt: ['all', 'nonAffectees', 'nonRealisables', 'enPDP'],
  collectivite: ['all', 'nonAffectees', 'enPDP'],
  gestionnaire: ['traitees', 'all'],
};

const getAvailablePresetKeys = (role: UserRole | undefined, hasPermissionReseau: boolean): PresetKey[] => {
  const rolePresets = (role && presetsByRole[role]) ?? ['all'];
  return hasPermissionReseau ? ['aTraiter', ...rolePresets] : rolePresets;
};

const initialSortingState = [{ desc: true, id: 'Date de la demande' }];

/**
 * Permet de savoir quand la table est rafraichie par un changement de valeur et donc de ne pas centrer la carte sur la première demande quand les demandes changent.
 */
let isUpdatingDemandField = false;

function DemandesNew(): React.ReactElement {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? '';
  const userRole = session?.user?.role;
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [modalDemand, setModalDemand] = useState<DemandsListItem | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const { data: userPermissions } = trpc.permissions.mine.useQuery(undefined, { enabled: !!userRole });
  const hasPermissionReseau = (userPermissions ?? []).some((permission) => permission.type === 'reseau_de_chaleur');

  const availablePresetKeys = useMemo(() => getAvailablePresetKeys(userRole, hasPermissionReseau), [userRole, hasPermissionReseau]);

  const quickFilterPresets = useMemo(() => pick(allPresetDefinitions, availablePresetKeys), [availablePresetKeys]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [presetKey, setPresetKey] = useQueryState('preset', parseAsStringLiteral(allPresetKeys));
  const activePresetKey = useMemo(
    () =>
      presetKey && availablePresetKeys.includes(presetKey) ? presetKey : availablePresetKeys.includes('aTraiter') ? 'aTraiter' : 'all',
    [presetKey, availablePresetKeys]
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(allPresetDefinitions[activePresetKey].filters);
  const [filteredDemands, setFilteredDemands] = useState<DemandsListItem[]>([]);

  // Sync filters when preset changes from URL (browser back/forward) or when role/permissions resolve.
  useEffect(() => {
    setColumnFilters(allPresetDefinitions[activePresetKey].filters);
  }, [activePresetKey]);

  const handlePresetFiltersChange = useCallback(
    (newFilters: ColumnFiltersState, newPresetKey: PresetKey | null) => {
      setColumnFilters(newFilters);
      void setPresetKey(newPresetKey ?? 'all');
    },
    [setPresetKey]
  );

  const { data: demands = [], isLoading } = trpc.demands.gestionnaire.list.useQuery();

  const demandsMapData = useMemo(() => {
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
  const { mutateAsync: updateDemandMutation } = trpc.demands.gestionnaire.update.useMutation();

  const handleEmailClick = useCallback((demand: Demand) => setModalDemand(demand as unknown as DemandsListItem), []);

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<Demand>) => {
      isUpdatingDemandField = true; // prevent the map from being centered on the first demand
      await updateDemandMutation({ demandId, values: demandUpdate });

      utils.demands.gestionnaire.list.setData(undefined, (demands) =>
        (demands ?? []).map((demand) => (demand.id === demandId ? ({ ...demand, ...demandUpdate } as DemandsListItem) : demand))
      );
    }),
    [utils, updateDemandMutation]
  );

  const tableColumns: ColumnDef<DemandsListItem>[] = useMemo(
    () => [
      {
        align: 'center',
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {row.original.is_responsible && row.original.Status === DEMANDE_STATUS.EMPTY && !row.original['Prise de contact'] && (
              <Tooltip title={`Le statut est "en attente de prise en charge" et la case "prospect recontacté" n'est pas cochée.`}>
                <Icon name="fr-icon-flag-fill" size="sm" color="red" />
              </Tooltip>
            )}
            {row.original.haut_potentiel && <Badge type="haut_potentiel" />}
          </div>
        ),
        header: '',
        id: 'indicators',
        width: '46px',
      },
      {
        accessorKey: 'Status',
        cell: ({ row }) => (
          <Status demand={row.original as unknown as Demand} updateDemand={updateDemand} disabled={!row.original.is_responsible} />
        ),
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
        cell: ({ row }) => (
          <Contacted demand={row.original as unknown as Demand} updateDemand={updateDemand} disabled={!row.original.is_responsible} />
        ),
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Prospect recontacté',
        width: '85px',
      },
      {
        accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
        cell: ({ row }) => (
          <Contact demand={row.original as unknown as Demand} onEmailClick={handleEmailClick} disabled={!row.original.is_responsible} />
        ),
        enableSorting: false,
        header: 'Contact',
        width: '280px',
      },
      {
        accessorKey: 'Adresse',
        cell: ({ row }) => (
          <div className="whitespace-normal">
            {row.original.Adresse}
            {row.original['en PDP'] === 'Oui' && <Badge type="pdp" />}
          </div>
        ),
        enableSorting: false,
        header: () => (
          <div className="flex items-center">
            Adresse
            <Tooltip
              iconProps={{
                className: 'ml-1',
              }}
              title="La mention 'PDP' est indiquée pour les adresses situées dans le périmètre de développement prioritaire d'un réseau classé (connu par France Chaleur Urbaine)."
            />
          </div>
        ),
        width: '220px',
      },
      {
        accessorKey: 'Date de la demande',
        cellType: 'Date',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Date de la demande',
        width: '94px',
      },
      {
        accessorKey: 'Structure',
        cell: ({ row }) => <Tag text={row.original.Structure} />,
        enableGlobalFilter: false,
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
        filterType: 'Facets',
        header: 'Mode de chauffage',
        width: '134px',
      },
      {
        accessorKey: 'Distance au réseau',
        cell: ({ row }) => {
          const distance = row.original['Distance au réseau'];
          return distance != null ? <span>{distance}</span> : null;
        },
        enableGlobalFilter: false,
        filterProps: {
          domain: [0, 1000],
          unit: 'm',
        },
        filterType: 'Range',
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
        accessorFn: (row) => row.network_name ?? '',
        cell: ({ row }) => <AffectedNetworkCell demand={row.original} currentUserId={currentUserId} />,
        enableSorting: false,
        filterType: 'Facets',
        header: 'Réseau affecté',
        id: 'network_name',
        width: '260px',
      },
      {
        accessorKey: 'Logement',
        cell: ({ row }) => (
          <AdditionalInformation
            demand={row.original as unknown as Demand}
            field="Logement"
            updateDemand={updateDemand}
            type="number"
            disabled={!row.original.is_responsible}
          />
        ),
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Nb logements (lots)',
        sorting: 'nullsLast',
        width: '120px',
      },
      {
        accessorKey: 'Surface en m2',
        cell: ({ row }) => (
          <AdditionalInformation
            demand={row.original as unknown as Demand}
            field="Surface en m2"
            updateDemand={updateDemand}
            type="number"
            disabled={!row.original.is_responsible}
          />
        ),
        enableGlobalFilter: false,
        filterProps: {
          unit: 'm2',
        },
        filterType: 'Range',
        header: 'Surface en m2',
        width: '120px',
      },
      {
        accessorKey: 'Conso',
        cell: ({ row }) => (
          <AdditionalInformation
            demand={row.original as unknown as Demand}
            field="Conso"
            updateDemand={updateDemand}
            type="number"
            disabled={!row.original.is_responsible}
          />
        ),
        enableGlobalFilter: false,
        filterProps: {
          unit: 'MWh',
        },
        filterType: 'Range',
        header: 'Conso gaz (MWh)',
        width: '120px',
      },
      {
        accessorKey: 'comment_gestionnaire',
        cell: ({ row }) => (
          <Comment
            demand={row.original as unknown as Demand}
            field="comment_gestionnaire"
            updateDemand={updateDemand}
            disabled={!row.original.is_responsible}
          />
        ),
        enableSorting: false,
        header: 'Commentaires',
        width: '280px',
      },
      {
        accessorFn: (row) =>
          row.access_counts.gestionnaire + row.access_counts.collectivite + row.access_counts.alec + row.access_counts.ccrt,
        cell: ({ row }) => <AccessCountsCell demandId={row.original.id} accessCounts={row.original.access_counts} />,
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Accès',
        id: 'access',
        width: '130px',
      },
      // obligatoire afin d'être utilisables dans les presets
      {
        accessorKey: 'haut_potentiel',
        filterType: 'Facets', // obligatoire pour faire fonctionner le filtre
        visible: false,
      },
      {
        accessorKey: 'en PDP',
        filterType: 'Facets', // obligatoire pour faire fonctionner le filtre
        visible: false,
      },
      {
        accessorKey: 'is_responsible',
        filterType: 'Facets', // obligatoire pour faire fonctionner le filtre
        visible: false,
      },
      {
        accessorKey: 'network_id',
        filterType: 'EmptyOrFilled', // obligatoire pour faire fonctionner le filtre « Demandes non affectées »
        visible: false,
      },
    ],
    [updateDemand, currentUserId, handleEmailClick]
  );

  const onTableRowClick = useCallback(
    (demandId: string) => {
      setSelectedDemandId(demandId);
      const selectedDemand = demands.find((demand) => demand.id === demandId);
      if (selectedDemand) {
        setMapCenterLocation({
          center: [selectedDemand.Longitude ?? 0, selectedDemand.Latitude ?? 0],
          flyTo: true,
          zoom: 16,
        });
      }
    },
    [demands]
  );

  const buildSheetData = useCallback(
    () => [
      {
        columns: demandsExportColumns,
        data: demands,
        name: 'demandes',
      },
    ],
    [demands]
  );

  const onTableFiltersChange = useCallback((filteredDemands: DemandsListItem[]) => {
    setFilteredDemands(filteredDemands);

    // center on the first demand if any
    const firstDemand = filteredDemands[0];
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
      title="Suivi des demandes"
      description="Votre tableau de bord pour la gestion des demandes des réseaux de chaleur"
      mode="authenticated"
    >
      <DemandEmailModal demand={modalDemand as unknown as Demand | null} onClose={() => setModalDemand(null)} updateDemand={updateDemand} />
      <div className="mb-8">
        <div className="flex items-center flex-wrap">
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
            onFiltersChange={handlePresetFiltersChange}
          />
          <ButtonExport filename="demandes_fcu.xlsx" sheets={buildSheetData} className="ml-auto mr-2w" priority="secondary">
            Exporter
          </ButtonExport>
        </div>
        <ResizablePanelGroup orientation="horizontal" className="gap-4">
          <ResizablePanel defaultSize="66%">
            <TableSimple
              columns={tableColumns}
              data={demands}
              loading={isLoading}
              initialSortingState={initialSortingState}
              globalFilter={globalFilter}
              columnFilters={columnFilters}
              onFilterChange={onTableFiltersChange}
              fluid
              controlsLayout="block"
              padding="sm"
              rowSelection={tableRowSelection}
              onRowClick={onTableRowClick}
              loadingEmptyMessage="Vous n'avez pas encore reçu de demandes"
              height="calc(100dvh - 140px)"
            />
          </ResizablePanel>
          <ResizableSeparator />
          <ResizablePanel defaultSize="34%">
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
                  adressesEligibles={demandsMapData}
                  adressesEligiblesAutoFit={false}
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

export default DemandesNew;

export const getServerSideProps = withAuthentication(['gestionnaire', 'collectivite', 'alec', 'ccrt', 'admin']);
