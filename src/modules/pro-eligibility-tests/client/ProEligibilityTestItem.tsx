import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { Fragment, useEffect, useMemo, useState } from 'react';

import { clientConfig } from '@/client-config';
import Map, { type AdresseEligible } from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { VerticalDivider } from '@/components/ui/Divider';
import Indicator from '@/components/ui/Indicator';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import Notice from '@/components/ui/Notice';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/TableSimple';
import Tooltip from '@/components/ui/Tooltip';
import { toastErrors } from '@/modules/notification';
import EligibilityChangeTooltip from '@/modules/pro-eligibility-tests/client/EligibilityChangeTooltip';
import RenameEligibilityTestForm from '@/modules/pro-eligibility-tests/client/RenameEligibilityTestForm';
import UpsertEligibilityTestForm from '@/modules/pro-eligibility-tests/client/UpsertEligibilityTestForm';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { downloadString } from '@/utils/browser';
import cx from '@/utils/cx';
import { formatAsISODateMinutes, formatFrenchDate, formatFrenchDateTime } from '@/utils/date';
import { compareFrenchStrings } from '@/utils/strings';
import { ObjectEntries, ObjectKeys } from '@/utils/typescript';
import { getProEligibilityTestAsXlsx } from '../utils/xlsx';
import ProcheReseauBadge, { type ProcheReseauBadgeProps } from './ProcheReseauBadge';

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

      // Calculer le changement de distance si possible
      let changeIndicator: { text: string; isPositive: boolean } | null = null;
      if (history && history.length >= 2) {
        const mostRecent = history[history.length - 1];
        const previous = history[history.length - 2];
        const recentDistance = mostRecent.eligibility.distance;
        const previousDistance = previous.eligibility.distance;

        if (recentDistance !== previousDistance) {
          // Réseau apparu
          if (previousDistance === 0 && recentDistance > 0) {
            changeIndicator = { isPositive: true, text: '★ nouveau' };
          }
          // Réseau disparu
          else if (recentDistance === 0 && previousDistance > 0) {
            changeIndicator = { isPositive: false, text: '✕ disparu' };
          }
          // Rapprochement
          else if (recentDistance < previousDistance) {
            changeIndicator = { isPositive: true, text: `${recentDistance - previousDistance}` };
          }
          // Éloignement
          else {
            changeIndicator = { isPositive: false, text: `+${recentDistance - previousDistance}` };
          }
        }
      }

      return (
        <div className="flex flex-col items-end">
          <span>{distance}m</span>
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
          <Tooltip title={<EligibilityChangeTooltip history={history} />} side="left" />
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
    accessorKey: 'eligibility.tauxENRR',
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
    accessorKey: 'eligibility.contenuCO2ACV',
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
    cell: (info) => {
      info.row.original.eligibility?.id_sncu && (
        <Link href={`/reseaux/${info.row.original.eligibility.id_sncu}`} isExternal title="Ouvrir la fiche réseau">
          {info.row.original.eligibility.id_sncu}
        </Link>
      );
    },
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
    getStat: (addresses) => addresses.filter((address) => address.eligibility?.isEligible).length,
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
      { id: 'eligibility_tauxENRR', value: [50, 100] },
    ],
    getStat: (addresses) =>
      addresses.filter(
        (address) =>
          address.eligibility?.distance &&
          address.eligibility.distance <= 100 &&
          address.eligibility.tauxENRR &&
          address.eligibility.tauxENRR >= 50
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

  const presetStats = ObjectKeys(quickFilterPresets).reduce(
    (acc, key) => ({
      ...acc,
      [key]: quickFilterPresets[key].getStat(addresses),
    }),
    {} as Record<QuickFilterPresetKey, number>
  );

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      return;
    }
    await onDelete?.();
  };

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

  useEffect(() => {
    if (viewDetail && test.has_unseen_results && !readOnly && !isMarkAsSeenLoading) {
      void (async () => {
        await markAsSeen({ id: test.id });
      })();
    }
  }, [viewDetail, test.has_unseen_results, markAsSeen, refetch, readOnly, isMarkAsSeenLoading]);

  const filteredAddressesMapData = useMemo(() => {
    return filteredAddresses
      .filter((address) => address.ban_valid && address.geom)
      .map(
        (address) =>
          ({
            address: address.ban_address ?? '',
            id: address.id,
            isEligible: address.eligibility?.isEligible ?? false,
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
          contenuCO2ACV: address.eligibility?.contenuCO2ACV === null ? undefined : address.eligibility?.contenuCO2ACV,
          // This can't be done on the backend because undefined are stripped from the json
          distance: address.eligibility?.distance === null ? 0 : address.eligibility?.distance,
          tauxENRR: address.eligibility?.tauxENRR === null ? undefined : address.eligibility?.tauxENRR,
        },
      })),
    [addresses]
  );

  const isDataLoading = isLoading || !!(test.has_pending_jobs && addresses.length === 0);

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
              🚀 Mises à jour
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
          {ObjectEntries(quickFilterPresets).map(([key, preset], index) => (
            <Fragment key={key}>
              <Indicator
                loading={isDataLoading}
                label={preset.label}
                value={presetStats[key]}
                onClick={() => toggleFilterPreset(key)}
                active={isPresetActive(key)}
              />
              {index < Object.keys(quickFilterPresets).length - 1 && <VerticalDivider />}
            </Fragment>
          ))}
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
                <Dialog
                  title="Accompagnement par France Chaleur Urbaine"
                  trigger={<Button iconId="fr-icon-mail-line">Être mis en relation avec les gestionnaires des réseaux</Button>}
                >
                  <div className="text-gray-700">
                    <p className="mb-4">
                      France Chaleur Urbaine peut assurer votre mise en relation avec les gestionnaires de réseaux de chaleur. Cette mise en
                      relation vous permet d'obtenir plus d'informations sur la faisabilité des raccordements et les conditions tarifaires,
                      sans aucun engagement de votre part.
                    </p>
                    <p className="mb-6">
                      Utilisez le bouton ci-dessous pour nous contacter : un conseiller France Chaleur Urbaine reviendra vers vous dans les
                      plus brefs délais.
                    </p>
                    <div className="flex justify-center">
                      <Button
                        iconId="fr-icon-mail-line"
                        priority="secondary"
                        linkProps={{
                          href: `mailto:${clientConfig.contactEmail}?subject=${encodeURIComponent(
                            `[FCU] Demande de mise en relation - Test "${test.name}"`
                          )}&body=${encodeURIComponent(
                            `Bonjour,\n\nJe souhaite être mis en relation avec les gestionnaires de réseaux de chaleur concernés par certaines adresses de mon test d'adresses "${test.name}".\n\nMerci de me recontacter pour étudier mon projet.\n\nCordialement`
                          )}`,
                        }}
                      >
                        Contacter France Chaleur Urbaine
                      </Button>
                    </div>
                  </div>
                </Dialog>
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
    </UrlStateAccordion>
  );
}

export default ProEligibilityTestItem;
