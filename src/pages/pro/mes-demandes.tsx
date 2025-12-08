import Badge from '@codegouvfr/react-dsfr/Badge';
import type { ColumnFiltersState } from '@tanstack/react-table';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EligibilityHelpDialog from '@/components/EligibilityHelpDialog';
import Input from '@/components/form/dsfr/Input';
import ModeDeChauffageTag, { getModeDeChauffageDisplay } from '@/components/Manager/ModeDeChauffageTag';
import Tag from '@/components/Manager/Tag';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import FCUBadge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import Gestionnaire from '@/modules/demands/client/Gestionnaire';
import Status from '@/modules/demands/client/Status';
import { eligibilityTitleByType } from '@/modules/demands/constants';
import type { Demand } from '@/modules/demands/types';
import { toastErrors } from '@/modules/notification';
import EligibilityHistoryTooltip from '@/modules/pro-eligibility-tests/client/EligibilityHistoryTooltip';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { withAuthentication } from '@/server/authentication';
import type { DemandStatus } from '@/types/enum/DemandSatus';
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { stopPropagation } from '@/utils/events';
import { formatMWh } from '@/utils/strings';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

type DemandsList = RouterOutput['demands']['user']['list'];
type DemandsListItem = DemandsList[number];

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

const quickFilterPresets = {
  all: {
    filters: [],
    getStat: (demands) => demands.length,
    label: 'demandes totales',
  },
} satisfies Record<string, QuickFilterPreset<DemandsListItem>>;

const initialSortingState = [{ desc: true, id: 'Date de la demande' }];

function DemandesNew(): React.ReactElement {
  const router = useRouter();
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);
  const [modalDemand, setModalDemand] = useState<DemandsListItem | null>(null);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: demands = [], isLoading } = trpc.demands.user.list.useQuery();

  // Sélectionner automatiquement la demande si demand_id est dans l'URL
  useEffect(() => {
    if (router.query.demand_id && typeof router.query.demand_id === 'string' && demands.length > 0) {
      const demandId = router.query.demand_id;
      const demand = demands.find((d) => d.id === demandId);
      if (demand) {
        setSelectedDemandId(demandId);
        setMapCenterLocation({
          center: [demand.Longitude ?? 0, demand.Latitude ?? 0],
          flyTo: true,
          zoom: 16,
        });
      }
    }
  }, [router.query.demand_id, demands]);

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
            modeDeChauffage:
              getModeDeChauffageDisplay({
                modeDeChauffage: demand['Mode de chauffage'],
                typeDeChauffage: demand['Type de chauffage'],
              }) ?? undefined,
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
        accessorFn: (row) => {
          const gestionnaires = row.Gestionnaires || [];
          const affectation = row['Affecté à'];
          return [...gestionnaires, ...(affectation ? [affectation].flat() : [])].join(' ');
        },
        cell: ({ row }) => <Gestionnaire demand={row.original as unknown as Demand} />,
        enableSorting: false,
        header: 'Gestionnaire',
        width: '200px',
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
        header: () => 'Mises à jour du réseau',
        width: '100px',
      },
      {
        accessorKey: 'Réseau le plus proche',
        cell: ({ row }) => {
          const nom = row.original['Nom réseau'];
          const distance = row.original['Distance au réseau'] || 0;

          if (!nom) {
            return null;
          }
          return (
            <div className="flex flex-col gap-1">
              <div>
                <Link href={`/reseaux/${row.original['Identifiant réseau']}`}>
                  <strong>{nom}</strong>
                </Link>
              </div>
              {distance > 0 && <span>{distance}m</span>}
            </div>
          );
        },
        header: 'Nom du réseau le plus proche',
        width: '200px',
      },
      {
        accessorKey: 'Date de la demande',
        align: 'right',
        cellType: 'Date',
        enableGlobalFilter: false,
        header: 'Date de la demande',
        width: '94px',
      },
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

  return (
    <SimplePage
      title="Mes demandes"
      description="Consultez et suivez l'ensemble de vos demandes de renseignements concernant les réseaux de chaleur"
      mode="authenticated"
      className="mb-8"
    >
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
    </SimplePage>
  );
}

export default DemandesNew;

export const getServerSideProps = withAuthentication(['particulier', 'professionnel', 'gestionnaire', 'admin']);
