import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import type { ColumnFiltersState, RowSelectionState, SortingState } from '@tanstack/react-table';
import dynamic from 'next/dynamic';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';

import type { AdresseEligible } from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import Notice from '@/components/ui/Notice';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { toastErrors } from '@/modules/notification';
import { BatchDemandMultiStepForm } from '@/modules/pro-eligibility-tests/client/BatchDemandMultiStepForm';
import EligibilityHistoryTooltip from '@/modules/pro-eligibility-tests/client/EligibilityHistoryTooltip';
import RenameEligibilityTestForm from '@/modules/pro-eligibility-tests/client/RenameEligibilityTestForm';
import UpsertEligibilityTestForm from '@/modules/pro-eligibility-tests/client/UpsertEligibilityTestForm';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { downloadString } from '@/utils/browser';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { formatAsISODateMinutes, formatFrenchDate, formatFrenchDateTime } from '@/utils/date';
import { compareFrenchStrings } from '@/utils/strings';
import { getProEligibilityTestAsXlsx } from '../utils/xlsx';
import ProcheReseauBadge, { type ProcheReseauBadgeProps } from './ProcheReseauBadge';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

const columns: ColumnDef<RouterOutput['proEligibilityTests']['get']['addresses'][number]>[] = [
  {
    accessorFn: (row) => `${row.ban_address} ${row.source_address}`,
    accessorKey: 'ban_address',
    cell: (info) => (
      <div>
        <div>
          <div className="leading-none tracking-tight">{info.row.original.ban_address}</div>
          {!info.row.original.ban_valid && (
            <Badge severity="error" small>
              Adresse invalide
            </Badge>
          )}
        </div>
        <div className=" text-xs italic text-gray-500 tracking-tighter">{info.row.original.source_address}</div>
      </div>
    ),
    enableSorting: false,
    header: () => (
      <>
        Adresse
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={
            <>
              Pour chaque ligne du tableau, la première adresse correspond à l'adresse testée (adresse trouvée dans la Base Adresse
              Nationale). La seconde est celle présente dans le fichier téléversé.
            </>
          }
        />
      </>
    ),
    sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.ban_address, rowB.original.ban_address),
    width: 'minmax(200px, 1fr)',
  },
  {
    accessorKey: 'demand_id',
    align: 'center',
    cell: (info) =>
      info.getValue() && (
        <Link href={`/pro/mes-demandes?demand_id=${info.getValue()}`} title="Voir la demande">
          Demande créée
        </Link>
      ),
    enableSorting: false,
    header: () => 'Demande de raccordement',
    width: '130px',
  },
  {
    accessorKey: 'ban_score',
    align: 'right',
    enableSorting: false,
    filterProps: {
      unit: '%',
    },
    filterType: 'Range',
    header: () => (
      <>
        Indice de fiabilité
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={
            <>
              Min = 0 , Max = 100. Cet indice traduit la correspondance entre l'adresse renseignée par l'utilisateur et celle effectivement
              testée.
            </>
          }
        />
      </>
    ),
    suffix: '%',
    width: '90px',
  },
  {
    accessorKey: 'etat_reseau',
    align: 'center',
    cell: (info) => <ProcheReseauBadge type={info.getValue()} />,
    enableSorting: false,
    filterProps: {
      Component: ({ value }) => <ProcheReseauBadge type={value as ProcheReseauBadgeProps['type']} />,
    },
    filterType: 'Facets',
    header: () => (
      <>
        Proche réseau
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={
            <>
              Le bâtiment se situe à moins de 200 m d'un réseau existant ou en construction, ou dans une zone où un réseau est en
              construction, dont nous n’avons pas encore le tracé. <em>Exception : sur Paris, le seuil de distance est réduit à 100 m.</em>
            </>
          }
        />
      </>
    ),
    width: '130px',
  },
  {
    accessorKey: 'eligibility.distance',
    align: 'right',
    cell: (info) => {
      const distance = info.getValue();
      const history = info.row.original.eligibility_history;
      const eligibility = info.row.original.eligibility;
      // Calcule le changement de distance si possible
      let changeIndicator: { text: string; isPositive: boolean } | null = null;
      if (history && history.length >= 2) {
        const previous = history[history.length - 2];
        const newDistance = eligibility.distance;
        const previousDistance = previous.eligibility.distance;

        if (newDistance !== previousDistance) {
          // Réseau apparu
          if (previousDistance === 0 && newDistance > 0) {
            changeIndicator = { isPositive: true, text: '★ nouveau' };
          }
          // Réseau disparu
          else if (newDistance === 0 && previousDistance > 0) {
            changeIndicator = { isPositive: false, text: '✕ disparu' };
          }
          // Rapprochement
          else if (newDistance < previousDistance) {
            changeIndicator = { isPositive: true, text: `${newDistance - previousDistance}` };
          }
          // Éloignement
          else {
            changeIndicator = { isPositive: false, text: `+${newDistance - previousDistance}` };
          }
        }
      }

      if (!eligibility.eligible) {
        return null;
      }

      return (
        <div className="flex flex-col items-end">
          <span>{isDefined(distance) ? `${distance}m` : ''}</span>
          {changeIndicator && (
            <span className={cx('text-xs', changeIndicator.isPositive ? 'text-success' : 'text-error')}>{changeIndicator.text}</span>
          )}
        </div>
      );
    },
    filterProps: {
      unit: 'm',
    },
    filterType: 'Range',
    header: () => (
      <>
        Distance au réseau
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={<>Distance au réseau le plus proche, fournie uniquement si elle est de moins de 1000m.</>}
        />
      </>
    ),
    sortUndefined: 'last',
    width: '130px',
  },
  {
    accessorKey: 'eligibility.calculated_at',
    align: 'center',
    cell: (info) => {
      const history = info.row.original.eligibility_history;

      return (
        <div className="flex items-center justify-center gap-1">
          <Tooltip title={<EligibilityHistoryTooltip history={history} />} side="left" />
        </div>
      );
    },
    header: () => 'Mises à jour',
    sortingFn: (rowA, rowB) => {
      const aHistory = rowA.original.eligibility_history;
      const bHistory = rowB.original.eligibility_history;
      const aDate = aHistory?.length ? new Date(aHistory[aHistory.length - 1].calculated_at) : null;
      const bDate = bHistory?.length ? new Date(bHistory[bHistory.length - 1].calculated_at) : null;

      if (aDate === null && bDate === null) return 0;
      if (aDate === null) return 1;
      if (bDate === null) return -1;

      // Most recent date first (descending)
      return bDate.getTime() - aDate.getTime();
    },
    width: '100px',
  },
  {
    accessorKey: 'in_pdp',
    align: 'center',
    cellType: 'Boolean',
    enableSorting: false,
    filterType: 'Facets',
    header: () => (
      <>
        PDP
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={
            <>
              Positif si l'adresse se situe dans le <strong>périmètre de développement prioritaire</strong> d'un réseau classé (d'après les
              données dont nous disposons). Une obligation de raccordement peut alors s'appliquer.
            </>
          }
        />
      </>
    ),
    width: '70px',
  },
  {
    accessorKey: 'eligibility.taux_enrr',
    align: 'right',
    filterProps: {
      domain: [0, 100],
      unit: '%',
    },
    filterType: 'Range',
    header: () => (
      <>
        Taux EnR&R
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={<>Taux d'énergies renouvelables et de récupération issu de l'arrêté DPE du 11 avril 2025</>}
        />
      </>
    ),
    sortUndefined: 'last',
    suffix: '%',
    width: '100px',
  },
  {
    accessorKey: 'eligibility.contenu_co2_acv',
    align: 'right',
    cell: (info) => (info.getValue() ? `${info.getValue() * 1000}` : ''),
    filterProps: {
      step: 0.001,
      unit: 'g/kWh',
    },
    filterType: 'Range',
    header: () => (
      <>
        Contenu CO2 ACV (g/kWh)
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={<>Contenu CO2 en analyse du cycle de vie issu de l'arrêté DPE du 11 avril 2025</>}
        />
      </>
    ),
    sortUndefined: 'last',
    width: '130px',
  },
  {
    accessorKey: 'eligibility.id_sncu',
    align: 'right',
    cell: (info) =>
      info.row.original.eligibility?.id_sncu && (
        <Link href={`/reseaux/${info.row.original.eligibility.id_sncu}`} isExternal title="Ouvrir la fiche réseau">
          {info.row.original.eligibility.id_sncu}
        </Link>
      ),
    enableSorting: false,
    header: () => (
      <>
        Identifiant
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={<>Identifiant réseau national</>}
        />
      </>
    ),
    width: '130px',
  },
];

const initialSortingState: SortingState = [
  {
    desc: false,
    id: 'eligibility_distance',
  },
];

const quickFilterPresets = {
  adressesDansPDP: {
    filters: [
      {
        id: 'in_pdp',
        value: { false: false, true: true },
      },
    ],
    getStat: (addresses) => addresses.filter((address) => address.in_pdp).length,
    label: (
      <>
        dans un périmètre de développement prioritaire&nbsp;
        <Tooltip
          title={
            <>
              Une obligation de raccordement peut s'appliquer.{' '}
              <Link href="/ressources/obligations-raccordement#contenu" isExternal>
                En savoir plus
              </Link>
            </>
          }
        />
      </>
    ),
  },
  adressesEligibles: {
    filters: [{ id: 'eligibility_type', value: { aucun: false, en_construction: true, existant: true } }],
    getStat: (addresses) => addresses.filter((address) => address.eligibility?.eligible).length,
    label: (
      <>
        potentiellement raccordables&nbsp;
        <Tooltip
          title={
            <>
              Le bâtiment est jugé potentiellement raccordable s'il se situe à moins de 200 m d'un réseau existant, sauf sur Paris où ce
              seuil est réduit à 100 m. Attention, le mode de chauffage n'est pas pris en compte.
            </>
          }
        />
      </>
    ),
  },
  adressesMoins100mPlus50ENRR: {
    filters: [
      { id: 'eligibility_distance', value: [0, 100] },
      { id: 'eligibility_taux_enrr', value: [50, 100] },
    ],
    getStat: (addresses) =>
      addresses.filter(
        (address) =>
          address.eligibility?.distance &&
          address.eligibility.distance <= 100 &&
          address.eligibility.taux_enrr &&
          address.eligibility.taux_enrr >= 50
      ).length,
    label: "à moins de 100m d'un réseau à plus de 50% d'ENR&R",
  },
  all: {
    filters: [],
    getStat: (addresses) => addresses.length,
    label: 'adresses',
  },
} satisfies Record<string, QuickFilterPreset<RouterOutput['proEligibilityTests']['get']['addresses'][number]>>;
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

const queryParamName = 'test-adresses';

type ProEligibilityTestItemProps = {
  test: RouterOutput['proEligibilityTests']['list']['items'][number] | RouterOutput['proEligibilityTests']['listAdmin']['items'][number];
  onDelete?: () => void;
  readOnly?: boolean;
  className?: string;
};
function ProEligibilityTestItem({ test, onDelete, readOnly = false, className }: ProEligibilityTestItemProps) {
  const [value] = useQueryState(queryParamName);
  const [viewDetail, setViewDetail] = useState(value === test.id);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<RouterOutput['proEligibilityTests']['get']['addresses']>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data: testDetails, isLoading, refetch } = trpc.proEligibilityTests.get.useQuery({ id: test.id }, { enabled: viewDetail });

  const utils = trpc.useUtils();

  const { mutateAsync: markAsSeen, isPending: isMarkAsSeenLoading } = trpc.proEligibilityTests.markAsSeen.useMutation({
    onError: () => {
      // Invalidate queries on error to refetch the correct state
      void utils.proEligibilityTests.list.invalidate();
      void utils.proEligibilityTests.get.invalidate({ id: test.id });
    },
    onSuccess: async () => {
      void utils.proEligibilityTests.list.invalidate();
      void utils.proEligibilityTests.get.invalidate({ id: test.id });
    },
  });

  const addresses = testDetails?.addresses ?? [];

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      return;
    }
    await onDelete?.();
  };

  useEffect(() => {
    if (viewDetail && (test.has_unseen_results || test.has_unseen_changes) && !readOnly && !isMarkAsSeenLoading) {
      void (async () => {
        await markAsSeen({ id: test.id });
      })();
    }
  }, [viewDetail, test.has_unseen_results, test.has_unseen_changes, markAsSeen, refetch, readOnly, isMarkAsSeenLoading]);

  const filteredAddressesMapData = useMemo(() => {
    return filteredAddresses
      .filter((address) => address.ban_valid && address.geom)
      .map(
        (address) =>
          ({
            address: address.ban_address ?? '',
            id: address.id,
            isEligible: address.eligibility?.eligible ?? false,
            latitude: address.geom!.coordinates[1],
            longitude: address.geom!.coordinates[0],
          }) satisfies AdresseEligible
      );
  }, [filteredAddresses]);

  const downloadCSV = toastErrors(async () => {
    if (!addresses.length) return;

    const xlsx = await getProEligibilityTestAsXlsx(addresses);

    downloadString(
      xlsx,
      `fcu-${test.name}-adresses-${formatAsISODateMinutes(new Date())}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });

  const adresses = useMemo(
    () =>
      (addresses || []).map((address) => ({
        ...address,
        eligibility: {
          ...address.eligibility,
          contenu_co2_acv: address.eligibility?.contenu_co2_acv === null ? undefined : address.eligibility?.contenu_co2_acv,
          // This can't be done on the backend because undefined are stripped from the json
          distance: address.eligibility?.distance === null ? 0 : address.eligibility?.distance,
          taux_enrr: address.eligibility?.taux_enrr === null ? undefined : address.eligibility?.taux_enrr,
        },
      })),
    [addresses]
  );

  const isDataLoading = isLoading || !!(test.has_pending_jobs && addresses.length === 0);

  const selectedAddresses = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => adresses[Number(index)])
      .filter((addr): addr is NonNullable<typeof addr> => !!addr)
      .map((addr) => ({
        ban_address: addr.ban_address,
        demand_id: addr.demand_id,
        id: addr.id,
      }));
  }, [rowSelection, adresses]);

  return (
    <UrlStateAccordion
      queryParamName={queryParamName}
      multi={false}
      id={test.id}
      className={className}
      label={
        <div className="flex items-center justify-between w-full">
          <div>{test.name}</div>
          {!readOnly && (
            <ModalSimple
              title="Renommer le test"
              trigger={<Button priority="tertiary no outline" size="small" iconId="fr-icon-pencil-line" title="Renommer le test" />}
              size="large"
            >
              <RenameEligibilityTestForm currentName={test.name} testId={test.id} />
            </ModalSimple>
          )}
          <div className="flex-auto" />
          {test.has_unseen_changes && (
            <Badge severity="warning" small className="fr-mx-1w">
              Mises à jour
            </Badge>
          )}
          {test.last_job_has_error && (
            <Badge severity="error" small className="fr-mx-1w">
              Erreur
            </Badge>
          )}
          {test.has_pending_jobs ? (
            <Badge severity="new" noIcon small className="fr-mx-1w">
              <Loader height={12} width={12} strokeWidth={6} color="var(--text-action-high-yellow-moutarde)" className="mr-2" /> Mise à jour
              en attente
            </Badge>
          ) : (
            test.has_unseen_results && (
              <Badge severity="info" small className="fr-mx-1w">
                Nouveaux résultats
              </Badge>
            )
          )}
          <div className="fr-mx-1w text-xs text-gray-800 font-normal cursor-help" title={formatFrenchDateTime(new Date(test.updated_at))}>
            {readOnly && (
              <>
                <span className="font-semibold">
                  {(test as RouterOutput['proEligibilityTests']['listAdmin']['items'][number]).user_email}
                </span>{' '}
                -{' '}
              </>
            )}
            Dernière mise à jour&nbsp;: {formatFrenchDate(new Date(test.updated_at))}
          </div>
        </div>
      }
      onClose={
        !readOnly
          ? async () => {
              await handleDelete();
            }
          : undefined
      }
      onExpandedChange={async (expanded) => {
        setViewDetail(expanded);
        if (expanded && test.has_unseen_results && !readOnly) {
          await markAsSeen({ id: test.id });
          await refetch();
        }
      }}
    >
      <div className="flex flex-wrap mb-4">
        <div className="flex items-center">
          <QuickFilterPresets
            presets={quickFilterPresets}
            data={addresses}
            loading={isDataLoading}
            columnFilters={columnFilters}
            onFiltersChange={setColumnFilters}
            hideDividerOnMobile={false}
          />
        </div>
        <div className="flex items-center gap-2 w-full mt-2">
          <Button iconId="fr-icon-download-line" priority="primary" onClick={downloadCSV} disabled={filteredAddresses.length === 0}>
            Télécharger les résultats détaillés
          </Button>

          {!readOnly && (
            <>
              <Button iconId="fr-icon-add-line" priority="secondary" onClick={() => setIsDialogOpen(true)}>
                Ajouter des adresses
              </Button>
              <ModalSimple title="Ajout d'adresses" size="medium" open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <UpsertEligibilityTestForm testId={test.id} onComplete={() => setIsDialogOpen(false)} />
              </ModalSimple>
            </>
          )}
        </div>
      </div>
      {isDataLoading && <Loader size="lg" variant="section" />}
      {viewDetail &&
        (addresses.length > 0 ? (
          <>
            <Tabs
              className="[&_[role='tabpanel']]:p-2w!" // decrease the default big padding of tabs panels
              tabs={[
                {
                  content: (
                    <TableSimple
                      controlsLayout="block"
                      columns={columns}
                      data={adresses}
                      initialSortingState={initialSortingState}
                      columnFilters={columnFilters}
                      enableGlobalFilter
                      padding="sm"
                      rowHeight={56}
                      onFilterChange={setFilteredAddresses}
                      enableRowSelection={!readOnly}
                      rowSelection={rowSelection}
                      onRowSelectionChange={setRowSelection}
                    />
                  ),
                  iconId: 'fr-icon-list-unordered',
                  isDefault: true,
                  label: `Liste (${filteredAddresses.length})`,
                },
                {
                  content: (
                    <div className="min-h-[50vh] aspect-4/3">
                      <Map
                        initialMapConfiguration={createMapConfiguration({
                          reseauxDeChaleur: {
                            show: true,
                          },
                          reseauxEnConstruction: true,
                          zonesDeDeveloppementPrioritaire: true,
                        })}
                        geolocDisabled
                        withLegend={false}
                        withoutLogo
                        adressesEligibles={filteredAddressesMapData}
                      />
                    </div>
                  ),
                  iconId: 'fr-icon-map-pin-2-line',
                  label: (
                    <>
                      Carte ({filteredAddressesMapData.length}){' '}
                      <Tooltip
                        iconProps={{ className: 'ml-1', color: 'var(--text-default-grey)' }}
                        title="Une différence de nombre de résultats peut exister si la requête à la Base d'Adresse Nationale n'as pas fonctionné ou si les coordonnées géographiques ne sont pas disponibles."
                      />
                    </>
                  ),
                },
              ]}
            />
            {!readOnly && (
              <div className="flex justify-end mt-4">
                <Button
                  iconId="fr-icon-mail-line"
                  priority="primary"
                  variant="warning"
                  onClick={() => {
                    setIsBatchModalOpen(true);
                  }}
                  disabled={Object.keys(rowSelection).length === 0}
                >
                  Être mis en relation ({Object.keys(rowSelection).length})
                </Button>
              </div>
            )}
          </>
        ) : (
          !isLoading && (
            <Notice size="sm">
              Les résultats ne sont pas encore disponibles et devraient l'être d'ici quelques minutes selon la taille de votre fichier.
            </Notice>
          )
        ))}
      {!readOnly && (
        <ModalSimple title="Demande de mise en relation" size="large" open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
          <BatchDemandMultiStepForm
            addresses={selectedAddresses}
            onSuccess={() => {
              setIsBatchModalOpen(false);
              setRowSelection({});
              void refetch();
            }}
          />
        </ModalSimple>
      )}
    </UrlStateAccordion>
  );
}

export default ProEligibilityTestItem;
