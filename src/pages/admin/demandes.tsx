import Badge from '@codegouvfr/react-dsfr/Badge';
import { useQueryClient } from '@tanstack/react-query';
import { type Virtualizer } from '@tanstack/react-virtual';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type RefObject } from 'react';
import { type MapGeoJSONFeature, type MapRef } from 'react-map-gl/maplibre';

import Input from '@/components/form/dsfr/Input';
import AdditionalInformation from '@/components/Manager/AdditionalInformation';
import Comment from '@/components/Manager/Comment';
import Contact from '@/components/Manager/Contact';
import Tag from '@/components/Manager/Tag';
import { type AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
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
import { type Point } from '@/types/Point';
import { type AdminDemand, type Demand } from '@/types/Summary/Demand';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { putFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';
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

const tagsGestionnairesStyleByType = {
  ville: { title: 'Ville', className: '!bg-[#27ca53] !text-white' },
  metropole: { title: 'Métropole', className: '!bg-[#1747a7] !text-white' },
  gestionnaire: { title: 'Gestionnaire tête de réseau', className: '!bg-[#8940d2] !text-white' },
  reseau: { title: 'Réseau spécifique', className: '!bg-[#d24047] !text-white' },
};

function DemandesAdmin(): React.ReactElement {
  const queryClient = useQueryClient();
  const mapRef = useRef<MapRef>(null) as RefObject<MapRef>;
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>(null) as RefObject<Virtualizer<HTMLDivElement, Element>>;
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [filteredDemands, setFilteredDemands] = useState<AdminDemand[]>([]);

  const { data: demands = [], isLoading } = useFetch<AdminDemand[]>('/api/admin/demands');

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
      await putFetchJSON(`/api/admin/demands/${demandId}`, demandUpdate);

      queryClient.setQueryData<AdminDemand[]>(['/api/admin/demands'], (demands) =>
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
        cell: (info) => (
          <div className="block">
            <div className="flex flex-wrap gap-1">
              {(info.getValue<string[]>() ?? []).map((tag) => (
                <Tag key={tag} text={tag} />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              Conseillé:
              {info.row.original.recommended_tags.map((tag) => (
                <Badge
                  small
                  className={cx('!block', tagsGestionnairesStyleByType[tag.type].className)}
                  key={tag.name}
                  {...{ title: tagsGestionnairesStyleByType[tag.type].title }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        ),
        width: '250px',
        enableSorting: false,
      },
      {
        accessorKey: 'Affecté à',
        header: 'Affecté à',
        cell: ({ row }) => <AdditionalInformation demand={row.original} field="Affecté à" updateDemand={updateDemand} type="text" />,
        width: '200px',
        enableSorting: false,
      },
      {
        id: 'action',
        accessorKey: 'Gestionnaire validé',
        header: 'Validation',
        cell: ({ row }) => (
          <AsyncButton
            priority="primary"
            size="small"
            onClick={async () => {
              console.log('validate', row.original.id);
            }}
          >
            Valider
          </AsyncButton>
        ),
        width: '120px',
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
        accessorKey: 'Structure',
        header: 'Type',
        cell: ({ row }) => <Tag text={row.original.Structure} />,
        width: '130px',
        filterType: 'Facets',
        enableGlobalFilter: false,
      },
      {
        accessorFn: (row) => displayModeDeChauffage(row),
        header: 'Mode de chauffage',
        cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
        width: '134px',
        filterType: 'Facets',
        enableGlobalFilter: false,
      },
      {
        accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
        header: 'Contact',
        cell: ({ row }) => <Contact demand={row.original} onEmailClick={() => {}} />,
        width: '280px',
        enableSorting: false,
      },
      {
        accessorKey: 'Date de la demande',
        header: 'Date de la demande',
        cellType: 'Date',
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
        cell: ({ row }) => (
          <AdditionalInformation demand={row.original} field="Distance au réseau" updateDemand={updateDemand} type="number" />
        ),
        width: '120px',
        filterType: 'Range',
        filterProps: {
          domain: [0, 1000],
          unit: 'm',
        },
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'Identifiant réseau',
        header: 'ID réseau le plus proche',
        width: '85px',
        filterType: 'Facets',
      },
      {
        accessorKey: 'Nom réseau',
        header: 'Nom du réseau le plus proche',
        cell: ({ row }) => <div className="whitespace-normal">{row.original['Nom réseau']}</div>,
        width: '200px',
      },
      {
        accessorKey: 'Logement',
        header: 'Nb logements (lots)',
        cell: ({ row }) => <AdditionalInformation demand={row.original} field="Logement" updateDemand={updateDemand} type="number" />,
        width: '120px',
        filterType: 'Range',
        sorting: 'nullsLast',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'Surface en m2',
        header: 'Surface en m2',
        cell: ({ row }) => <AdditionalInformation demand={row.original} field="Surface en m2" updateDemand={updateDemand} type="number" />,
        width: '120px',
        filterType: 'Range',
        filterProps: {
          unit: 'm2',
        },
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'Conso',
        header: 'Conso gaz (MWh)',
        cell: ({ row }) => <AdditionalInformation demand={row.original} field="Conso" updateDemand={updateDemand} type="number" />,
        width: '120px',
        filterType: 'Range',
        filterProps: {
          unit: 'MWh',
        },
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'Commentaires',
        header: 'Commentaires',
        cell: ({ row }) => <Comment demand={row.original} updateDemand={updateDemand} />,
        width: '280px',
        enableSorting: false,
      },
      {
        accessorKey: 'Commentaires interne FCU',
        header: 'Commentaires interne FCU',
        cell: ({ row }) => (
          <></>
          // FIXME TODO ajouter le commentaire interne FCU
        ),
        width: '280px',
        enableSorting: false,
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
        <div className="flex items-center flex-wrap">
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
                  mapRef={mapRef}
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
