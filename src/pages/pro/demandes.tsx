import type { ColumnFiltersState } from '@tanstack/react-table';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import DemandEmailForm from '@/components/Manager/DemandEmailForm';
import ModeDeChauffageTag, { getModeDeChauffageDisplay } from '@/components/Manager/ModeDeChauffageTag';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import AdditionalInformation from '@/modules/demands/client/AdditionalInformation';
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
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import type { ExportColumn } from '@/utils/export';

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
  { accessorKey: 'comment_gestionnaire', name: 'Commentaires' },
  {
    accessorKey: 'Affecté à',
    name: 'Affecté à',
  },
];

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
              Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100
              logements, ou tertiaires.
            </>
          }
        />
      </>
    ),
    valueSuffix: <Badge type="haut_potentiel" />,
  },
  demandesATraiter: {
    filters: [
      { id: 'Status', value: { 'En attente de prise en charge': true } },
      { id: 'Prise de contact', value: { false: true, true: false } },
    ],
    getStat: (demands) =>
      demands.filter((demand) => demand.Status === 'En attente de prise en charge' && !demand['Prise de contact']).length,
    label: (
      <>
        demandes à traiter&nbsp;
        <Tooltip
          title={`Le statut est "en attente de prise en charge" et la case "prospect recontacté" n'est pas cochée. La colonne "Affecté à" du tableau indique le gestionnaire à qui la demande a été transmise pour traitement.`}
        />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-flag-fill" size="sm" color="red" />,
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

/**
 * Permet de savoir quand la table est rafraichie par un changement de valeur et donc de ne pas centrer la carte sur la première demande quand les demandes changent.
 */
let isUpdatingDemandField = false;

function DemandesNew(): React.ReactElement {
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [modalDemand, setModalDemand] = useState<DemandsListItem | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filteredDemands, setFilteredDemands] = useState<DemandsListItem[]>([]);

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

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<Demand>) => {
      isUpdatingDemandField = true; // prevent the map from being centered on the first demand
      await updateDemandMutation({ demandId, values: demandUpdate });

      utils.demands.gestionnaire.list.setData(undefined, (demands) =>
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
        align: 'center',
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {row.original.Status === DEMANDE_STATUS.EMPTY && !row.original['Prise de contact'] && (
              <Tooltip
                title={`Le statut est "en attente de prise en charge" et la case "prospect recontacté" n'est pas cochée. La colonne "Affecté à" du tableau indique le gestionnaire à qui la demande a été transmise pour traitement.`}
              >
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
        cell: ({ row }) => <Status demand={row.original as unknown as Demand} updateDemand={updateDemand} />,
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
        accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
        cell: ({ row }) => <Contact demand={row.original as unknown as Demand} onEmailClick={() => setModalDemand(row.original)} />,
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
        accessorKey: 'comment_gestionnaire',
        cell: ({ row }) => <Comment demand={row.original as unknown as Demand} field="comment_gestionnaire" updateDemand={updateDemand} />,
        enableSorting: false,
        header: 'Commentaires',
        width: '280px',
      },
      {
        accessorKey: 'Affecté à',
        cell: ({ row }) => (
          <AdditionalInformation
            demand={row.original as unknown as Demand}
            field="Affecté à"
            updateDemand={updateDemand}
            type="text"
            width={125}
          />
        ),
        enableSorting: false,
        filterType: 'Facets',
        header: () => (
          <div className="flex items-center">
            Affecté à
            <Tooltip
              iconProps={{
                className: 'ml-1',
              }}
              title={
                <>
                  "Non affecté" : demande éloignée du réseau non transmise aux opérateurs
                  <br />
                  <br />
                  Vous pouvez ajouter ou modifier une affectation : le changement sera effectif après validation manuelle par l'équipe FCU.
                </>
              }
            />
          </div>
        ),
        width: '150px',
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
      <ModalSimple
        title={`Envoi d'un courriel à ${modalDemand?.Mail}`}
        open={!!modalDemand}
        size="large"
        onOpenChange={(open) => !open && setModalDemand(null)}
      >
        {modalDemand && <DemandEmailForm currentDemand={modalDemand as unknown as Demand} updateDemand={updateDemand} />}
      </ModalSimple>
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

export const getServerSideProps = withAuthentication(['gestionnaire', 'demo', 'admin']);
