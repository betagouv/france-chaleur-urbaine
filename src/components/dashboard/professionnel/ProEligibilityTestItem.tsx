import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { useQueryClient } from '@tanstack/react-query';
import { type ColumnFiltersState, type SortingState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import React from 'react';
import { Fragment, useEffect, useMemo, useState } from 'react';

import CompleteEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/CompleteEligibilityTestForm';
import RenameEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/RenameEligibilityTestForm';
import ProcheReseauBadge, { type ProcheReseauBadgeProps } from '@/components/dashboard/professionnel/ProcheReseauBadge';
import Map, { type AdresseEligible } from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import Notice from '@/components/ui/Notice';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Tooltip from '@/components/ui/Tooltip';
import { useDelete, useFetch, usePost } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';
import { type ProEligibilityTestWithAddresses } from '@/pages/api/pro-eligibility-tests/[id]';
import { notify, toastErrors } from '@/services/notification';
import { getProEligibilityTestAsXlsx } from '@/services/xlsx/test-adresses';
import { downloadString } from '@/utils/browser';
import { formatAsISODateMinutes, formatFrenchDate, formatFrenchDateTime } from '@/utils/date';
import { compareFrenchStrings } from '@/utils/strings';
import { type FlattenKeys, ObjectEntries } from '@/utils/typescript';

const columns: ColumnDef<ProEligibilityTestWithAddresses['addresses'][number]>[] = [
  {
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
    accessorKey: 'ban_address',
    accessorFn: (row) => `${row.ban_address} ${row.source_address}`,
    sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.ban_address, rowB.original.ban_address),
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
    flex: 1,
    enableSorting: false,
  },
  {
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
    accessorKey: 'ban_score',
    width: '90px',
    suffix: '%',
    align: 'right',
    enableSorting: false,
    filterType: 'Range',
    filterProps: {
      unit: '%',
    },
  },
  {
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
    accessorKey: 'eligibility_status.etat_reseau',
    cell: (info) => <ProcheReseauBadge type={info.getValue()} />,
    align: 'center',
    enableSorting: false,
    filterType: 'Facets',
    filterProps: {
      Component: ({ value }) => <ProcheReseauBadge type={value as ProcheReseauBadgeProps['type']} />,
    },
  },
  {
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
    width: '130px',
    accessorKey: 'eligibility_status.distance',
    suffix: 'm',
    align: 'right',
    sorting: 'nullsLast',
    filterType: 'Range',
    filterProps: {
      unit: 'm',
    },
  },
  {
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
    accessorKey: 'eligibility_status.inPDP',
    cellType: 'Boolean',
    align: 'center',
    enableSorting: false,
    filterType: 'Facets',
  },
  {
    header: () => (
      <>
        Taux EnR&R
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={<>Taux d'énergies renouvelables et de récupération issu de l'arrêté DPE du 16 mars 2023</>}
        />
      </>
    ),
    width: '100px',
    accessorKey: 'eligibility_status.tauxENRR',
    suffix: '%',
    align: 'right',
    sorting: 'nullsLast',
    filterType: 'Range',
    filterProps: {
      domain: [0, 100],
      unit: '%',
    },
  },
  {
    header: () => (
      <>
        Contenu CO2 ACV (g/kWh)
        <Tooltip
          iconProps={{
            className: 'fr-ml-1v',
          }}
          title={<>Contenu CO2 en analyse du cycle de vie issu de l'arrêté DPE du 16 mars 2023</>}
        />
      </>
    ),
    width: '130px',
    accessorKey: 'eligibility_status.co2',
    align: 'right',
    sorting: 'nullsLast',
    filterType: 'Range',
    filterProps: {
      unit: 'g/kWh',
      step: 0.001,
    },
  },
  {
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
    accessorKey: 'eligibility_status.id',
    cell: (info) =>
      info.row.original.eligibility_status?.id && (
        <Link href={`/reseaux/${info.row.original.eligibility_status.id}`} isExternal title="Ouvrir la fiche réseau">
          {info.row.original.eligibility_status.id}
        </Link>
      ),
    align: 'right',
    enableSorting: false,
  },
];

const initialSortingState: SortingState = [
  {
    id: 'eligibility_status_distance',
    desc: false,
  },
];

type DotToUnderscore<T extends string> = T extends `${infer A}.${infer B}` ? `${A}_${DotToUnderscore<B>}` : T;

type QuickFilterPreset = {
  label: React.ReactNode;
  filters: Array<{
    id: DotToUnderscore<FlattenKeys<ProEligibilityTestWithAddresses['addresses'][number]>>;
    value: boolean | number | [number, number] | Record<string, boolean>;
  }>;
};

const quickFilterPresets = {
  all: {
    label: 'adresses',
    filters: [],
  },
  adressesEligibles: {
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
    filters: [{ id: 'eligibility_status_isEligible', value: { true: true, false: false } }],
  },
  adressesMoins100mPlus50ENRR: {
    label: "à moins de 100m d'un réseau à plus de 50% d'ENR&R",
    filters: [
      { id: 'eligibility_status_distance', value: [0, 100] },
      { id: 'eligibility_status_tauxENRR', value: [50, 100] },
    ],
  },
  adressesDansPDP: {
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
    filters: [
      {
        id: 'eligibility_status_inPDP',
        value: { true: true, false: false },
      },
    ],
  },
} satisfies Record<string, QuickFilterPreset>;
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

const queryParamName = 'test-adresses';

type ProEligibilityTestItemProps = {
  test: ProEligibilityTestListItem & {
    user_email?: string;
  };
  readOnly?: boolean;
};
function ProEligibilityTestItem({ test, readOnly = false }: ProEligibilityTestItemProps) {
  const queryClient = useQueryClient();
  const [value] = useQueryState(queryParamName);
  const [viewDetail, setViewDetail] = useState(value === test.id);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<ProEligibilityTestWithAddresses['addresses']>([]);

  const {
    data: testDetails,
    isLoading,
    refetch,
  } = useFetch<ProEligibilityTestWithAddresses>(`/api/pro-eligibility-tests/${test.id}`, {
    enabled: viewDetail,
  });

  const { mutateAsync: markAsSeen } = usePost(`/api/pro-eligibility-tests/${test.id}/mark-as-seen`, {
    onMutate: () => {
      queryClient.setQueryData<ProEligibilityTestListItem[]>(['/api/pro-eligibility-tests'], (tests) =>
        (tests ?? []).map((testItem) => (testItem.id === test.id ? { ...testItem, has_unseen_results: false } : testItem))
      );
    },
  });

  const { mutateAsync: deleteTest } = useDelete(`/api/pro-eligibility-tests/${test.id}`, {
    invalidate: ['/api/pro-eligibility-tests'],
  });

  const addresses = testDetails?.addresses ?? [];

  const presetStats: Record<QuickFilterPresetKey, number> = {
    all: addresses.length,
    adressesEligibles: addresses.filter((address) => address.eligibility_status && address.eligibility_status.isEligible).length,
    adressesMoins100mPlus50ENRR: addresses.filter(
      (address) =>
        address.eligibility_status?.distance &&
        address.eligibility_status.distance <= 100 &&
        address.eligibility_status?.tauxENRR &&
        address.eligibility_status.tauxENRR >= 50
    ).length,
    adressesDansPDP: addresses.filter((address) => address.eligibility_status && address.eligibility_status.inPDP).length,
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      return;
    }
    await deleteTest(testId);
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
    if (viewDetail && test.has_unseen_results) {
      (async () => {
        void markAsSeen({});
        await refetch();
        notify('success', 'Les résultats de ce test ont été mis à jour');
      })();
    }
  }, [viewDetail, test.has_unseen_results, markAsSeen, refetch]);

  const filteredAddressesMapData = useMemo(() => {
    return filteredAddresses
      .filter((address) => address.ban_valid && address.geom)
      .map(
        (address) =>
          ({
            id: address.id,
            longitude: address.geom!.coordinates[0],
            latitude: address.geom!.coordinates[1],
            address: address.ban_address ?? '',
            isEligible: address.eligibility_status?.isEligible ?? false,
          }) satisfies AdresseEligible
      );
  }, [filteredAddresses]);

  const downloadCSV = toastErrors(async () => {
    if (!testDetails?.addresses.length) return;

    const xlsx = await getProEligibilityTestAsXlsx(testDetails.addresses);

    downloadString(
      xlsx,
      `fcu-${test.name}-adresses-${formatAsISODateMinutes(new Date())}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });

  return (
    <UrlStateAccordion
      queryParamName={queryParamName}
      multi={false}
      id={test.id}
      label={
        <div className="flex items-center justify-between w-full">
          <div>{test.name}</div>
          {!readOnly && (
            <ModalSimple
              title="Renommer le test"
              trigger={<Button priority="tertiary no outline" size="small" iconId="fr-icon-pencil-line" title="Renommer le test" />}
            >
              <RenameEligibilityTestForm currentName={test.name} testId={test.id} />
            </ModalSimple>
          )}
          <div className="flex-auto" />
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
                <span className="font-semibold">{test.user_email}</span> -{' '}
              </>
            )}
            Dernière mise à jour&nbsp;: {formatFrenchDate(new Date(test.updated_at))}
          </div>
        </div>
      }
      onClose={
        !readOnly
          ? async () => {
              await handleDelete(test.id);
            }
          : undefined
      }
      onExpandedChange={(expanded) => {
        setViewDetail(expanded);
        if (expanded && test.has_unseen_results && !readOnly) {
          markAsSeen({});
        }
      }}
    >
      <div className="flex flex-wrap mb-4">
        <div className="flex items-center">
          {ObjectEntries(quickFilterPresets).map(([key, preset], index) => (
            <Fragment key={key}>
              <Indicator
                loading={isLoading}
                label={preset.label}
                value={presetStats[key]}
                onClick={() => toggleFilterPreset(key)}
                active={isPresetActive(key)}
              />
              {index < Object.keys(quickFilterPresets).length - 1 && <Divider />}
            </Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full mt-2">
          <Button iconId="fr-icon-download-line" priority="primary" onClick={downloadCSV} disabled={filteredAddresses.length === 0}>
            Télécharger les résultats détaillés
          </Button>

          {!readOnly && (
            <ModalSimple
              title="Ajout d'adresses"
              size="medium"
              trigger={
                <Button iconId="fr-icon-add-line" priority="secondary">
                  Ajouter des adresses
                </Button>
              }
            >
              <CompleteEligibilityTestForm testId={test.id} />
            </ModalSimple>
          )}
        </div>
      </div>
      {isLoading && <Loader size="lg" variant="section" />}
      {viewDetail &&
        (testDetails && testDetails.addresses.length > 0 ? (
          <>
            <Tabs
              className="[&_[role='tabpanel']]:!p-2w" // decrease the default big padding of tabs panels
              tabs={[
                {
                  label: `Liste (${filteredAddresses.length})`,
                  iconId: 'fr-icon-list-unordered',
                  content: (
                    <TableSimple
                      controlsLayout="block"
                      columns={columns}
                      data={testDetails?.addresses || []}
                      initialSortingState={initialSortingState}
                      columnFilters={columnFilters}
                      enableGlobalFilter
                      padding="sm"
                      rowHeight={56}
                      onFilterChange={setFilteredAddresses}
                    />
                  ),
                  isDefault: true,
                },
                {
                  label: (
                    <>
                      Carte ({filteredAddressesMapData.length}){' '}
                      <Tooltip
                        iconProps={{ color: 'var(--text-default-grey)', className: 'ml-1' }}
                        title="Une différence de nombre de résultats peut exister si la requête à la Base d'Adresse Nationale n'as pas fonctionné ou si les coordonnées géographiques ne sont pas disponibles."
                      />
                    </>
                  ),
                  iconId: 'fr-icon-map-pin-2-line',
                  content: (
                    <div className="min-h-[50vh] aspect-[4/3]">
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
                },
              ]}
            />
            {!readOnly && (
              <div className="flex justify-end mt-4">
                <Dialog
                  title="Accompagnement par France Chaleur Urbaine"
                  trigger={<Button iconId="fr-icon-mail-line">Demander conseil à un expert de France Chaleur Urbaine</Button>}
                >
                  <div className="text-gray-700">
                    <p className="mb-4">
                      France Chaleur Urbaine peut vous accompagner dans votre démarche et vous mettre en relation avec le ou les
                      gestionnaires de réseaux de chaleur concernés par vos adresses.
                    </p>
                    <p className="mb-6">
                      Utilisez le bouton ci-dessous pour nous contacter. Un conseiller France Chaleur Urbaine prendra contact avec vous dans
                      les plus brefs délais pour étudier votre projet et faciliter vos échanges avec les gestionnaires de réseaux.
                    </p>
                    <div className="flex justify-center">
                      <Button
                        iconId="fr-icon-mail-line"
                        priority="secondary"
                        linkProps={{
                          href: `mailto:contact@france-chaleur-urbaine.fr?subject=${encodeURIComponent(
                            `[FCU] Demande de mise en relation - Test "${test.name}"`
                          )}&body=${encodeURIComponent(
                            `Bonjour,\n\nJe souhaite être mis en relation avec les gestionnaires de réseaux de chaleur concernés par mon test d'adresses "${test.name}" (ID: ${test.id}).\n\nMerci de me recontacter pour étudier mon projet.\n\nCordialement`
                          )}`,
                        }}
                      >
                        Contacter un expert France Chaleur Urbaine
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
type IndicatorProps = {
  label: React.ReactNode;
  value: number;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
};
const Indicator = ({ label, value, loading, onClick, active }: IndicatorProps) => {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      className={`fr-p-2w flex flex-col h-full transition-colors ${active ? 'text-blue' : ''} ${onClick ? 'cursor-pointer hover:bg-gray-100 text-left' : ''}`}
      onClick={onClick}
      title={onClick ? 'Cliquer pour filtrer' : undefined}
    >
      <div className="font-bold text-xl">{loading ? <Loader size="sm" className="my-[6px]" /> : value}</div>
      <div>{label}</div>
    </Element>
  );
};

const Divider = () => <div className="h-12 w-px bg-gray-300" />;

export default ProEligibilityTestItem;
