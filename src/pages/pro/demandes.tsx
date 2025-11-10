import { useQueryClient } from '@tanstack/react-query';
import type { ColumnFiltersState } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import dynamic from 'next/dynamic';
import { Fragment, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapGeoJSONFeature, MapRef } from 'react-map-gl/maplibre';

import Input from '@/components/form/dsfr/Input';
import AdditionalInformation from '@/components/Manager/AdditionalInformation';
import Comment from '@/components/Manager/Comment';
import Contact from '@/components/Manager/Contact';
import Contacted from '@/components/Manager/Contacted';
import DemandEmailForm from '@/components/Manager/DemandEmailForm';
import DemandStatusBadge from '@/components/Manager/DemandStatusBadge';
import Status from '@/components/Manager/Status';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Badge from '@/components/ui/Badge';
import { VerticalDivider } from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import Indicator from '@/components/ui/Indicator';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { toastErrors } from '@/modules/notification';
import { withAuthentication } from '@/server/authentication';
import { DEMANDE_STATUS, type DemandStatus } from '@/types/enum/DemandSatus';
import type { Point } from '@/types/Point';
import type { Demand } from '@/types/Summary/Demand';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import type { ExportColumn } from '@/utils/export';
import { putFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';
import { ObjectEntries, ObjectKeys } from '@/utils/typescript';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });
const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

export const demandsExportColumns: ExportColumn<Demand>[] = [
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
  { accessorKey: 'Date demandes', name: 'Date de demande' },
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
      demand['Gestionnaire Distance au réseau'] === undefined ? demand['Distance au réseau'] : demand['Gestionnaire Distance au réseau'],
    name: 'Distance au réseau (m)',
  },
  { accessorKey: 'Identifiant réseau', name: 'ID réseau le plus proche' },
  { accessorKey: 'Nom réseau', name: 'Nom du réseau le plus proche' },
  {
    accessorFn: (demand) => (demand['Gestionnaire Logement'] === undefined ? demand.Logement : demand['Gestionnaire Logement']),
    name: 'Nb logements',
  },
  {
    accessorKey: 'Surface en m2',
    name: 'Surface en m2',
  },
  {
    accessorFn: (demand) => (demand['Gestionnaire Conso'] === undefined ? demand.Conso : demand['Gestionnaire Conso']),
    name: 'Conso gaz (MWh)',
  },
  { accessorKey: 'Commentaire', name: 'Commentaires' },
  {
    accessorKey: 'Affecté à',
    name: 'Affecté à',
  },
];

const displayModeDeChauffage = (demand: Demand) => {
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
} satisfies Record<string, QuickFilterPreset<Demand>>;
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

const initialSortingState = [{ desc: true, id: 'Date de la demande' }];

function DemandesNew(): React.ReactElement {
  const queryClient = useQueryClient();
  const mapRef = useRef<MapRef>(null) as RefObject<MapRef>;
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>(null) as RefObject<Virtualizer<HTMLDivElement, Element>>;
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [modalDemand, setModalDemand] = useState<Demand | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);

  const { data: demands = [], isLoading } = useFetch<Demand[]>('/api/demands');

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
          address: demand.Adresse,
          id: demand.id,
          latitude: demand.Latitude,
          longitude: demand.Longitude,
          modeDeChauffage: displayModeDeChauffage(demand),
          selected: demand.id === selectedDemandId,
          typeDeLogement: demand.Structure,
        }) satisfies AdresseEligible
    );
  }, [filteredDemands, selectedDemandId]);

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<Demand>) => {
      await putFetchJSON(`/api/demands/${demandId}`, demandUpdate);

      queryClient.setQueryData<Demand[]>(['/api/demands'], (demands) =>
        (demands ?? []).map((demand) => {
          if (demand.id === demandId) {
            return { ...demand, ...demandUpdate };
          }
          return demand;
        })
      );
    }),
    []
  );

  const tableColumns: ColumnDef<Demand>[] = useMemo(
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
        cell: ({ row }) => <Status demand={row.original} updateDemand={updateDemand} />,
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
        cell: ({ row }) => <Contacted demand={row.original} updateDemand={updateDemand} />,
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Prospect recontacté',
        width: '85px',
      },
      {
        accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
        cell: ({ row }) => <Contact demand={row.original} onEmailClick={() => setModalDemand(row.original)} />,
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
          <AdditionalInformation demand={row.original} field="Distance au réseau" updateDemand={updateDemand} type="number" />
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
        cell: ({ row }) => <AdditionalInformation demand={row.original} field="Logement" updateDemand={updateDemand} type="number" />,
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Nb logements (lots)',
        sorting: 'nullsLast',
        width: '120px',
      },
      {
        accessorKey: 'Surface en m2',
        cell: ({ row }) => <AdditionalInformation demand={row.original} field="Surface en m2" updateDemand={updateDemand} type="number" />,
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
        cell: ({ row }) => <AdditionalInformation demand={row.original} field="Conso" updateDemand={updateDemand} type="number" />,
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
        cell: ({ row }) => <Comment demand={row.original} field="Commentaire" updateDemand={updateDemand} />,
        enableSorting: false,
        header: 'Commentaires',
        width: '280px',
      },
      {
        accessorKey: 'Affecté à',
        cell: ({ row }) => (
          <AdditionalInformation demand={row.original} field="Affecté à" updateDemand={updateDemand} type="text" width={125} />
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
          flyTo: true,
          zoom: 16,
        });
      }
    },
    [demands]
  );

  const onTableFiltersChange = useCallback((demands: Demand[]) => {
    setFilteredDemands(demands);

    // center on the first demand if any
    const firstDemand = demands[0];
    if (firstDemand) {
      setMapCenterLocation({
        center: [firstDemand.Longitude, firstDemand.Latitude],
        flyTo: true,
        zoom: 8,
      });
    }
  }, []);

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
        {modalDemand && <DemandEmailForm currentDemand={modalDemand} updateDemand={updateDemand} />}
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
          {ObjectEntries(quickFilterPresets).map(([key, preset], index) => (
            <Fragment key={key}>
              <Indicator
                loading={isLoading}
                label={preset.label}
                value={presetStats[key]}
                valueSuffix={'valueSuffix' in preset ? preset.valueSuffix : null}
                onClick={() => toggleFilterPreset(key)}
                active={isPresetActive(key)}
              />
              {index < Object.keys(quickFilterPresets).length - 1 && <VerticalDivider className="hidden md:block" />}
            </Fragment>
          ))}
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
                  mapRef={mapRef}
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

export default DemandesNew;

export const getServerSideProps = withAuthentication(['gestionnaire', 'demo', 'admin']);
