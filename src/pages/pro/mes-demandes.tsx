import type { ColumnFiltersState } from '@tanstack/react-table';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Badge from '@/components/ui/Badge';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import AdditionalInformation from '@/modules/demands/client/AdditionalInformation';
import Comment from '@/modules/demands/client/Comment';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import type { Demand } from '@/modules/demands/types';
import { toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { withAuthentication } from '@/server/authentication';
import type { DemandStatus } from '@/types/enum/DemandSatus';
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import type { ExportColumn } from '@/utils/export';
import { upperCaseFirstChar } from '@/utils/strings';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });
const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

type DemandsList = RouterOutput['demands']['user']['list'];
type DemandsListItem = DemandsList[number];

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

export const demandsExportColumns: ExportColumn<DemandsListItem>[] = [
  { accessorKey: 'Date de la demande', name: 'Date de demande' },
  { accessorKey: 'Adresse', name: 'Adresse' },
  {
    accessorKey: 'en PDP',
    name: 'En PDP',
  },
  {
    accessorKey: 'Status',
    name: 'Statut',
  },
  { accessorKey: 'Structure', name: 'Type' },
  {
    accessorKey: 'Mode de chauffage',
    name: 'Mode de chauffage',
  },
  {
    accessorKey: 'Type de chauffage',
    name: 'Type de chauffage',
  },
  {
    accessorFn: (demand) =>
      (demand['Gestionnaire Distance au réseau'] === undefined
        ? demand['Distance au réseau']
        : demand['Gestionnaire Distance au réseau']) ?? 0,
    name: 'Distance au réseau (m)',
  },
  { accessorKey: 'Identifiant réseau', name: 'ID réseau le plus proche' },
  { accessorKey: 'Nom réseau', name: 'Nom du réseau le plus proche' },
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
  { accessorKey: 'Commentaire', name: 'Commentaires' },
];

const displayModeDeChauffage = (demand: DemandsListItem) => {
  const modeDeChauffage = demand['Mode de chauffage']?.toLowerCase()?.trim();
  if (modeDeChauffage && ['gaz', 'fioul', 'électricité'].includes(modeDeChauffage)) {
    return `${upperCaseFirstChar(modeDeChauffage)} ${demand['Type de chauffage'] ? demand['Type de chauffage'].toLowerCase() : ''}`;
  }
  return demand['Type de chauffage'];
};

const quickFilterPresets = {
  all: {
    filters: [],
    getStat: (demands) => demands.length,
    label: 'demandes totales',
  },
  demandesAHautPotentiel: {
    filters: [{ id: 'haut_potentiel', value: { false: false, true: true } }],
    getStat: (demands) => demands.filter((demand) => demand.haut_potentiel).length,
    label: (
      <>
        demandes à haut potentiel&nbsp;
        <Tooltip
          title={
            <>
              Comptabilise les demandes en chauffage collectif à moins de 100m d'un réseau (moins de 60m sur Paris), ou à plus de 100
              logements, ou tertiaires.
            </>
          }
        />
      </>
    ),
    valueSuffix: <Badge type="haut_potentiel" />,
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
    valueSuffix: <Badge type="pdp" />,
  },
} satisfies Record<string, QuickFilterPreset<DemandsListItem>>;

const initialSortingState = [{ desc: true, id: 'Date de la demande' }];

function DemandesNew(): React.ReactElement {
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: demands = [], isLoading } = trpc.demands.user.list.useQuery();

  const demandsMapData = useMemo(() => {
    return demands
      .filter((demand) => isDefined(demand.Latitude) && isDefined(demand.Longitude))
      .map(
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
  }, [demands, selectedDemandId]);

  const utils = trpc.useUtils();
  const { mutateAsync: updateDemandMutation } = trpc.demands.user.update.useMutation();

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<Demand>) => {
      await updateDemandMutation({ demandId, values: demandUpdate });

      utils.demands.user.list.setData(undefined, (demands) =>
        (demands ?? []).map((demand) => {
          if (demand.id === demandId) {
            return { ...demand, ...demandUpdate } as DemandsListItem;
          }
          return demand;
        })
      );
    }),
    [utils, updateDemandMutation]
  );

  const tableColumns: ColumnDef<DemandsListItem>[] = useMemo(
    () => [
      {
        accessorKey: 'Date de la demande',
        cellType: 'Date',
        enableGlobalFilter: false,
        header: 'Date de la demande',
        width: '94px',
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
        accessorKey: 'Status',
        cell: ({ row }) => <DemandStatusBadge status={row.original.Status as DemandStatus} />,
        enableGlobalFilter: false,
        filterProps: {
          Component: ({ value }) => <DemandStatusBadge status={value as DemandStatus} />,
        },
        filterType: 'Facets',
        header: 'Statut',
        width: '220px',
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
        accessorFn: (row) => displayModeDeChauffage(row),
        cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Mode de chauffage',
        width: '134px',
      },
      {
        accessorKey: 'Distance au réseau',
        cell: ({ row }) => (
          <AdditionalInformation
            demand={row.original as unknown as Demand}
            field="Distance au réseau"
            updateDemand={updateDemand}
            type="number"
          />
        ),
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
        accessorKey: 'Identifiant réseau',
        filterType: 'Facets',
        header: 'ID réseau le plus proche',
        width: '85px',
      },
      {
        accessorKey: 'Nom réseau',
        cell: ({ row }) => <div className="whitespace-normal">{row.original['Nom réseau']}</div>,
        header: 'Nom du réseau le plus proche',
        width: '200px',
      },
      {
        accessorKey: 'Logement',
        cell: ({ row }) => (
          <AdditionalInformation demand={row.original as unknown as Demand} field="Logement" updateDemand={updateDemand} type="number" />
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
          <AdditionalInformation demand={row.original as unknown as Demand} field="Conso" updateDemand={updateDemand} type="number" />
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
        accessorKey: 'Commentaires',
        cell: ({ row }) => <Comment demand={row.original as unknown as Demand} field="Commentaire" updateDemand={updateDemand} />,
        enableSorting: false,
        header: 'Commentaires',
        width: '280px',
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
    ],
    [updateDemand]
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

  return (
    <SimplePage
      title="Mes demandes"
      description="Consultez et suivez l'ensemble de vos demandes de renseignements concernant les réseaux de chaleur"
      mode="authenticated"
    >
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
            presets={quickFilterPresets as any}
            data={demands}
            loading={isLoading}
            columnFilters={columnFilters}
            onFiltersChange={setColumnFilters}
          />
          <ButtonExport filename="demandes_fcu.xlsx" sheets={buildSheetData} className="ml-auto mr-2w" priority="secondary">
            Exporter
          </ButtonExport>
        </div>
        <ResizablePanelGroup direction="horizontal" className="gap-4">
          <ResizablePanel defaultSize={66}>
            <TableSimple
              columns={tableColumns}
              data={demands}
              loading={isLoading}
              initialSortingState={initialSortingState}
              globalFilter={globalFilter}
              columnFilters={columnFilters}
              fluid
              controlsLayout="block"
              padding="sm"
              rowSelection={tableRowSelection}
              onRowClick={onTableRowClick}
              loadingEmptyMessage="Vous n'avez pas encore de demandes"
              height="calc(100dvh - 140px)"
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

export const getServerSideProps = withAuthentication(['particulier', 'professionnel', 'gestionnaire', 'admin']);
