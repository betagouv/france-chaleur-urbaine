import Tag from '@codegouvfr/react-dsfr/Tag';
import type { ColumnFiltersState } from '@tanstack/react-table';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { type ReactNode, useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Timeago from '@/components/ui/Timeago';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { notify } from '@/modules/notification';
import { tagsGestionnairesStyleByType } from '@/modules/tags/constants';
import trpc from '@/modules/trpc/client';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { objectToURLSearchParams } from '@/utils/network';
import { compareFrenchStrings } from '@/utils/strings';
import type { TagsStats } from '../types';

const initialSortingState = [{ desc: true, id: 'lastSixMonths' }];
const initialFilterState = [{ id: 'type', value: { '': true, gestionnaire: false, metropole: true, reseau: true, ville: true } }];

export default function TagsStatsPage() {
  const { data: tagsStats, isLoading } = trpc.demands.admin.getTagsStats.useQuery();

  const tableColumns: ColumnDef<TagsStats>[] = useMemo(
    () => [
      {
        align: 'center',
        cell: ({ row }) =>
          row.original.lastThreeMonths.total > 0 &&
          row.original.lastThreeMonths.pending === row.original.lastThreeMonths.total && (
            <Tooltip title="Toutes les demandes < 3 mois sont en attente.">
              <Icon name="fr-icon-warning-fill" size="sm" className="text-red-600" />
            </Tooltip>
          ),
        enableColumnFilter: false,
        enableSorting: false,
        header: () => <span className="sr-only">Alerte</span>,
        id: 'warning',
        width: '40px',
      },
      {
        accessorKey: 'name',
        cell: ({ row }) => (
          <Tag className={cx(tagsGestionnairesStyleByType[row.original.type as keyof typeof tagsGestionnairesStyleByType]?.className)}>
            {row.original.name}
          </Tag>
        ),
        header: 'Tag',
        width: '200px',
      },
      {
        accessorKey: 'type',
        filter: 'equalsAny',
        filtersDialogLabel: 'Type de tag',
        filterType: 'Facets',
        id: 'type',
        visible: false,
      },
      {
        accessorFn: (row) => row.allTime.pending,
        cellType: 'Number',
        filterProps: {
          label: 'Nombre de demandes en attente',
        },
        filtersDialogDescription: 'Déplacez le curseur gauche pour fixer un minimum.',
        filtersDialogLabel: 'Demandes en attente (toutes périodes)',
        filterType: 'Range',
        header: 'pendingAllTimeFilter',
        id: 'pendingAllTimeFilter',
        visible: false,
      },
      {
        accessorFn: (row) => row.lastSixMonths.pending,
        cellType: 'Number',
        filterProps: {
          label: 'Nombre de demandes en attente',
        },
        filtersDialogDescription: 'Sélectionnez un intervalle de demandes en attente sur 6 mois.',
        filtersDialogLabel: 'Demandes en attente (< 6 mois)',
        filterType: 'Range',
        header: 'pendingSixMonthsFilter',
        id: 'pendingSixMonthsFilter',
        visible: false,
      },
      {
        accessorFn: (row) => row.lastThreeMonths.pending,
        cellType: 'Number',
        filterProps: {
          label: 'Nombre de demandes en attente',
        },
        filtersDialogDescription: 'Sélectionnez un intervalle de demandes en attente sur 3 mois.',
        filtersDialogLabel: 'Demandes en attente (< 3 mois)',
        filterType: 'Range',
        header: 'pendingThreeMonthsFilter',
        id: 'pendingThreeMonthsFilter',
        visible: false,
      },
      {
        accessorFn: (row) => row.users.map((u) => u.email).join(' '),
        cell: ({ row }) => {
          const users = row.original.users;
          return (
            <div className="flex flex-col gap-2">
              {users.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1">
                    {users.map((user) => {
                      const lastConnectionClassName = getLastConnectionClassName(user.last_connection);
                      return (
                        <Tag key={user.id} className="bg-gray-100 text-gray-800">
                          <div className="flex flex-col leading-tight break-all">
                            <span>{user.email}</span>
                            {user.last_connection ? (
                              <Timeago
                                date={user.last_connection}
                                className={cx('text-xs', lastConnectionClassName)}
                                prefix={
                                  <Icon
                                    name="fr-icon-time-line"
                                    size="xs"
                                    className={cx('mr-1', lastConnectionClassName)}
                                    title="Dernière connexion"
                                  />
                                }
                              />
                            ) : (
                              <span className="text-red-600 text-xs">Jamais connecté</span>
                            )}
                          </div>
                        </Tag>
                      );
                    })}
                  </div>
                  <div>
                    <Tooltip title="Copier les adresses e-mail dans le presse-papiers">
                      <Button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
                        onClick={() => copyContentToClipboard(users.map((user) => user.email).join(', '))}
                        iconId="fr-icon-clipboard-line"
                        priority="tertiary no outline"
                        size="small"
                      >
                        Copier les adresses
                      </Button>
                    </Tooltip>
                  </div>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Aucun utilisateur</span>
              )}
            </div>
          );
        },
        enableSorting: false,
        header: 'Utilisateurs gestionnaires',
        width: '250px',
      },
      {
        accessorFn: (row) => {
          return [
            ...row.reseauxDeChaleur.map((reseau) => `${reseau.id_fcu}${reseau.nom_reseau || ''}${reseau['Identifiant reseau'] || ''}`),
            ...row.reseauxEnConstruction.map((reseau) => `${reseau.id_fcu}${reseau.nom_reseau || ''}`),
          ].join(' | ');
        },
        cell: ({ row }) => {
          const networks = [
            ...row.original.reseauxDeChaleur.map((reseau) => ({
              className: 'text-white bg-[#0D543F]! hover:bg-[#0D543F]/90!',
              id: `existing-${reseau.id_fcu}`,
              label: `${reseau.nom_reseau || `Réseau ${reseau.id_fcu}`}${reseau['Identifiant reseau'] ? ` (${reseau['Identifiant reseau']})` : ''}`,
            })),
            ...row.original.reseauxEnConstruction.map((reseau) => ({
              className: 'text-white bg-[#DA5DD5]! hover:bg-[#DA5DD5]/90!',
              id: `construction-${reseau.id_fcu}`,
              label: `${reseau.nom_reseau || `Réseau ${reseau.id_fcu}`}${reseau.is_zone ? ' (zone)' : ''}`,
            })),
          ];

          if (networks.length === 0) {
            return <span className="text-gray-600 text-sm">Aucun réseau</span>;
          }

          const displayedNetworks = networks.slice(0, 2);
          const remainingNetworks = networks.slice(2);

          return (
            <div className="flex flex-wrap gap-1 items-center">
              {displayedNetworks.map((network) => (
                <Tag key={network.id} className={network.className}>
                  <div className="flex flex-col leading-tight">
                    <span>{network.label}</span>
                  </div>
                </Tag>
              ))}
              {remainingNetworks.length > 0 && (
                <Tooltip
                  title={
                    <div>
                      <div className="font-semibold mb-2">Autres réseaux ({remainingNetworks.length}) :</div>
                      <ul className="list-disc list-inside space-y-1">
                        {remainingNetworks.map((network) => (
                          <li key={network.id} className="text-sm">
                            <span className="font-medium">{network.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  }
                >
                  <span className="text-blue-600 hover:text-blue-800 underline cursor-help text-sm">
                    + {remainingNetworks.length} autre{remainingNetworks.length > 1 ? 's' : ''} réseau
                    {remainingNetworks.length > 1 ? 'x' : ''}
                  </span>
                </Tooltip>
              )}
            </div>
          );
        },
        header: 'Réseaux',
        id: 'reseaux',
        sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.getValue('reseaux'), rowB.getValue('reseaux')),
        width: '330px',
      },
      {
        accessorKey: 'allTime',
        cell: ({ row }) => {
          const { pending, total } = row.original.allTime;
          return <DemandStatsCell pending={pending} total={total} tagName={row.original.name} />;
        },
        header: () => (
          <DemandStatColumnHeader>
            Demandes en attente / total
            <br />
            Toutes périodes
          </DemandStatColumnHeader>
        ),
        width: '120px',
      },
      {
        accessorFn: (row) => row.lastSixMonths.pending,
        accessorKey: 'lastSixMonths',
        cell: ({ row }) => {
          const { pending, total } = row.original.lastSixMonths;
          return <DemandStatsCell pending={pending} total={total} tagName={row.original.name} periodMonths={6} />;
        },
        header: () => (
          <DemandStatColumnHeader>
            Demandes en attente / total
            <br />
            &lt; 6 mois
          </DemandStatColumnHeader>
        ),
        width: '120px',
      },
      {
        accessorFn: (row) => row.lastThreeMonths.pending,
        accessorKey: 'lastThreeMonths',
        cell: ({ row }) => {
          const { pending, total } = row.original.lastThreeMonths;
          return <DemandStatsCell pending={pending} total={total} tagName={row.original.name} periodMonths={3} />;
        },
        header: () => (
          <DemandStatColumnHeader>
            Demandes en attente / total
            <br />
            &lt; 3 mois
          </DemandStatColumnHeader>
        ),
        width: '120px',
      },
    ],
    []
  );

  return (
    <SimplePage title="Statistiques par tag" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Statistiques par tag gestionnaire
      </Heading>

      <CallOut size="sm">
        <p>
          Cet écran permet de suivre l'activité des gestionnaires pour chaque tag, afin d'identifier les gestionnaires qui ne traitent pas
          les demandes.
        </p>
      </CallOut>

      <TableSimple
        columns={tableColumns}
        data={tagsStats || []}
        initialSortingState={initialSortingState}
        columnFilters={initialFilterState}
        enableGlobalFilter
        enableFiltersDialog
        controlsLayout="block"
        padding="sm"
        loading={isLoading}
        export={{
          fileName: 'tags_stats.xlsx',
          sheetName: 'tags_stats',
        }}
        urlSyncKey="tags"
      />
    </SimplePage>
  );
}

// Utilitaires
const getLastConnectionClassName = (value: string | null | undefined) => {
  if (!value) {
    return 'text-red-600';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'text-red-600';
  }

  const diffInMs = Date.now() - date.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInDays <= 30) {
    return 'text-green-600';
  }
  if (diffInDays <= 90) {
    return 'text-orange-500';
  }
  return 'text-red-600';
};

const DemandStatColumnHeader = ({ children }: { children: ReactNode }) => {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{children}</span>
      <Tooltip title="Nombre de demandes en attente sur la période / nombre total de demandes assignées au tag sur la même période." />
    </span>
  );
};

const DemandStatsCell = ({
  pending,
  total,
  tagName,
  periodMonths,
}: {
  pending: number;
  total: number;
  tagName: string;
  periodMonths?: number;
}) => {
  return (
    <span className="inline-flex items-baseline gap-1">
      <NextLink
        href={buildAdminDemandsUrl(buildDemandFilters(tagName, periodMonths, true))}
        className={cx('text-xl font-bold', pending > 0 ? 'text-red-600' : 'text-gray-900')}
      >
        {pending}
      </NextLink>
      <span className="text-xs">/</span>
      <NextLink href={buildAdminDemandsUrl(buildDemandFilters(tagName, periodMonths, false))}>{total}</NextLink>
    </span>
  );
};

const buildAdminDemandsUrl = (filters: ColumnFiltersState) => {
  return `/admin/demandes?${objectToURLSearchParams({ demands_filters: filters }).toString()}`;
};

const buildDemandFilters = (tagName: string, periodMonths: number | undefined, pendingOnly: boolean): ColumnFiltersState => {
  return [
    { id: 'Gestionnaires', value: [tagName] },
    ...(pendingOnly
      ? [
          { id: 'Status', value: { 'En attente de prise en charge': true } },
          { id: 'Prise de contact', value: { false: true, true: false } },
        ]
      : []),
    ...(isDefined(periodMonths)
      ? [{ id: 'Date de la demande', value: [dayjs().subtract(periodMonths, 'month').format('YYYY-MM-DD'), null, false] }]
      : []),
  ];
};

const copyContentToClipboard = (content: string) => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return;
  }

  void navigator.clipboard
    .writeText(content)
    .then(() => notify('success', 'Adresses copiées !'))
    .catch(() => {});
};
