import DSFRBadge from '@codegouvfr/react-dsfr/Badge';
import Tag from '@codegouvfr/react-dsfr/Tag';
import type { ColumnFiltersState } from '@tanstack/react-table';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { type ReactNode, useMemo } from 'react';

import { reseauDeChaleurNonClasseColor } from '@/components/Map/layers/reseauxDeChaleur';
import { reseauxEnConstructionColor } from '@/components/Map/layers/reseauxEnConstruction';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import { useCopy } from '@/components/ui/ButtonCopy';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import TimeAgo from '@/components/ui/TimeAgo';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { notify } from '@/modules/notification';
import { NotesCell, RemindersCell } from '@/modules/reseaux/client/admin/network-reminders-cells';
import type { NetworkType } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { objectToURLSearchParams } from '@/utils/network';
import { compareFrenchStrings } from '@/utils/strings';

import type { ReseauxStats } from '../types';

const initialSortingState = [{ desc: true, id: 'lastSixMonths' }];
const initialFilterState: ColumnFiltersState = [];

export default function ReseauxStatsPage() {
  const utils = trpc.useUtils();
  const { data: reseauxStats, isLoading } = trpc.demands.admin.getReseauxStats.useQuery();
  const { mutateAsync: createReminder } = trpc.reseaux.networkReminders.create.useMutation({
    onError: (error) => {
      notify('error', `Erreur lors de l'enregistrement de la relance : ${error.message}`);
    },
    onSuccess: () => {
      void utils.demands.admin.getReseauxStats.invalidate();
      notify('success', 'Relance enregistrée');
    },
  });
  const { mutateAsync: updateReminder } = trpc.reseaux.networkReminders.update.useMutation({
    onError: (error) => {
      notify('error', `Erreur lors de la mise à jour de la relance : ${error.message}`);
    },
    onSuccess: () => {
      void utils.demands.admin.getReseauxStats.invalidate();
      notify('success', 'Relance mise à jour');
    },
  });
  const { mutateAsync: deleteReminder } = trpc.reseaux.networkReminders.delete.useMutation({
    onError: (error) => {
      notify('error', `Erreur lors de la suppression de la relance : ${error.message}`);
    },
    onSuccess: () => {
      void utils.demands.admin.getReseauxStats.invalidate();
      notify('success', 'Relance supprimée');
    },
  });
  const { mutateAsync: updateNotes } = trpc.reseaux.networkReminders.updateNotes.useMutation({
    onError: (error) => {
      notify('error', `Erreur lors de la mise à jour des notes : ${error.message}`);
    },
    onSuccess: () => {
      void utils.demands.admin.getReseauxStats.invalidate();
    },
  });

  const tableColumns: ColumnDef<ReseauxStats>[] = useMemo(
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
        accessorFn: (row) => `${row.nom_reseau || ''} ${row.id_fcu} ${row['Identifiant reseau'] ?? ''}`,
        cell: ({ row }) => {
          const r = row.original;
          const isExistant = r.network_type === 'reseau_de_chaleur';
          return (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between gap-1">
                <Tooltip title={isExistant ? 'Réseau de chaleur existant' : 'Réseau de chaleur en construction'}>
                  <DSFRBadge
                    small
                    className="text-white! cursor-help"
                    style={{ backgroundColor: isExistant ? reseauDeChaleurNonClasseColor : reseauxEnConstructionColor }}
                  >
                    {isExistant ? 'Existant' : 'En construction'}
                  </DSFRBadge>
                </Tooltip>
                {r['Identifiant reseau'] && (
                  <Tooltip title="Identifiant SNCU du réseau">
                    <DSFRBadge className=" cursor-help">{r['Identifiant reseau']}</DSFRBadge>
                  </Tooltip>
                )}
              </div>
              <span className="text-sm font-semibold leading-snug">{r.nom_reseau || `Réseau ${r.id_fcu}`}</span>
              {(r.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {r.tags!.map((tag) => (
                    <Tag key={tag} small className="text-[10px]!">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          );
        },
        header: 'Réseau',
        id: 'reseau',
        sortingFn: (rowA, rowB) =>
          compareFrenchStrings(
            rowA.original.nom_reseau ?? `Réseau ${rowA.original.id_fcu}`,
            rowB.original.nom_reseau ?? `Réseau ${rowB.original.id_fcu}`
          ),
        width: '280px',
      },
      {
        accessorKey: 'network_type',
        filterType: 'Facets',
        header: 'Type',
        id: 'network_type',
        visible: false,
      },
      {
        accessorFn: (row) => row.users.map((u) => u.email).join(' | '),
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
                        <Tag as="span" key={user.id} className="bg-gray-100 text-gray-800">
                          <div className="flex flex-col leading-tight break-all text-xs">
                            <span>{user.email}</span>
                            {user.last_connection ? (
                              <TimeAgo
                                date={user.last_connection}
                                className={cx(lastConnectionClassName)}
                                prefix={<Icon name="fr-icon-time-line" size="xs" className="mr-1" title="Dernière connexion" />}
                              />
                            ) : (
                              <span className={cx(lastConnectionClassName)}>
                                <Icon name="fr-icon-time-line" size="xs" className="mr-1" title="Dernière connexion" />
                                Jamais connecté
                              </span>
                            )}
                          </div>
                        </Tag>
                      );
                    })}
                  </div>
                  <CopyEmailsButton emails={users.map((user) => user.email)} />
                </>
              ) : (
                <span className="text-gray-400 text-sm">Aucun utilisateur</span>
              )}
            </div>
          );
        },
        enableSorting: false,
        header: 'Utilisateurs',
        width: '250px',
      },
      {
        accessorFn: (row) => row.allTime.pending,
        cell: ({ row }) => {
          const { pending, total } = row.original.allTime;
          return (
            <DemandStatsCell pending={pending} total={total} networkId={row.original.id_fcu} networkType={row.original.network_type} />
          );
        },
        exportHeader: 'Demandes en attente (toutes périodes)',
        header: () => (
          <DemandStatColumnHeader>
            Demandes en attente / total
            <br />
            Toutes périodes
          </DemandStatColumnHeader>
        ),
        id: 'allTime',
        width: '110px',
      },
      {
        accessorFn: (row) => row.lastSixMonths.pending,
        cell: ({ row }) => {
          const { pending, total } = row.original.lastSixMonths;
          return (
            <DemandStatsCell
              pending={pending}
              total={total}
              networkId={row.original.id_fcu}
              networkType={row.original.network_type}
              periodMonths={6}
            />
          );
        },
        exportHeader: 'Demandes en attente (6 mois)',
        header: () => (
          <DemandStatColumnHeader>
            Demandes en attente / total
            <br />
            &lt; 6 mois
          </DemandStatColumnHeader>
        ),
        id: 'lastSixMonths',
        width: '110px',
      },
      {
        accessorFn: (row) => row.lastThreeMonths.pending,
        cell: ({ row }) => {
          const { pending, total } = row.original.lastThreeMonths;
          return (
            <DemandStatsCell
              pending={pending}
              total={total}
              networkId={row.original.id_fcu}
              networkType={row.original.network_type}
              periodMonths={3}
            />
          );
        },
        exportHeader: 'Demandes en attente (3 mois)',
        header: () => (
          <DemandStatColumnHeader>
            Demandes en attente / total
            <br />
            &lt; 3 mois
          </DemandStatColumnHeader>
        ),
        id: 'lastThreeMonths',
        width: '110px',
      },
      {
        accessorFn: (row) => row.reminders?.[0]?.created_at ?? null,
        cell: ({ row }) => (
          <RemindersCell
            reminders={row.original.reminders}
            onCreateReminder={(note, createdAt) =>
              createReminder({
                createdAt,
                networkId: row.original.id_fcu,
                networkType: row.original.network_type,
                note,
                type: 'demand',
              })
            }
            onUpdateReminder={(id, { note, createdAt }) => updateReminder({ createdAt, id, note })}
            onDeleteReminder={(id) => deleteReminder({ id })}
          />
        ),
        enableSorting: true,
        header: 'Relances',
        id: 'reminders',
        width: '250px',
      },
      {
        accessorKey: 'notes',
        cell: ({ row }) => (
          <NotesCell
            initialNotes={row.original.notes ?? ''}
            onSave={async (notes) => {
              await updateNotes({
                networkId: row.original.id_fcu,
                networkType: row.original.network_type,
                notes: notes.trim() || null,
              });
            }}
          />
        ),
        className: 'justify-between',
        enableSorting: false,
        header: 'Notes',
        width: '280px',
      },
      {
        accessorFn: (row) => row.users.length > 0,
        filtersDialogLabel: 'Utilisateurs assignés',
        filterType: 'Facets',
        header: 'hasUsers',
        id: 'hasUsers',
        visible: false,
      },
      {
        accessorFn: (row) => row.allTime.pending,
        filtersDialogDescription: 'Déplacez le curseur gauche pour fixer un minimum.',
        filtersDialogLabel: 'Demandes en attente (toutes périodes)',
        filterType: 'Range',
        header: 'pendingAllTimeFilter',
        id: 'pendingAllTimeFilter',
        visible: false,
      },
    ],
    [createReminder, updateReminder, deleteReminder, updateNotes]
  );

  return (
    <SimplePage title="Statistiques par réseau" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Statistiques par réseau
      </Heading>

      <CallOut size="sm">
        <p>
          Cet écran permet de suivre l'activité des gestionnaires pour chaque réseau, afin d'identifier les réseaux dont les demandes ne
          sont pas traitées.
        </p>
      </CallOut>

      <TableSimple
        columns={tableColumns}
        data={reseauxStats || []}
        initialSortingState={initialSortingState}
        columnFilters={initialFilterState}
        enableGlobalFilter
        enableFiltersDialog
        controlsLayout="block"
        padding="sm"
        loading={isLoading}
        export={{
          fileName: 'reseaux_stats.xlsx',
          sheetName: 'reseaux_stats',
        }}
        urlSyncKey="reseaux"
      />
    </SimplePage>
  );
}

// --- Utils ---

const getLastConnectionClassName = (value: string | null | undefined) => {
  if (!value) return 'text-error';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'text-error';
  const diffInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffInDays <= 30) return 'text-success';
  if (diffInDays <= 90) return 'text-orange-600';
  return 'text-error';
};

const DemandStatColumnHeader = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1">
    <span>{children}</span>
    <Tooltip title="Nombre de demandes en attente sur la période / nombre total de demandes assignées au réseau sur la même période." />
  </span>
);

const DemandStatsCell = ({
  pending,
  total,
  networkId,
  networkType,
  periodMonths,
}: {
  pending: number;
  total: number;
  networkId: number;
  networkType: NetworkType;
  periodMonths?: number;
}) => (
  <span className="inline-flex items-baseline gap-1">
    <NextLink
      href={buildAdminDemandsUrl(buildDemandFilters(networkId, networkType, periodMonths, true))}
      className={cx('text-xl font-bold', pending > 0 ? 'text-red-600' : 'text-gray-900')}
    >
      {pending}
    </NextLink>
    <span className="text-xs">/</span>
    <NextLink href={buildAdminDemandsUrl(buildDemandFilters(networkId, networkType, periodMonths, false))}>{total}</NextLink>
  </span>
);

const buildAdminDemandsUrl = (filters: ColumnFiltersState) => {
  return `/admin/demandes?${objectToURLSearchParams({ demands_filters: filters }).toString()}`;
};

const buildDemandFilters = (
  networkId: number,
  networkType: NetworkType,
  periodMonths: number | undefined,
  pendingOnly: boolean
): ColumnFiltersState => [
  { id: 'network_id', value: [`${networkType}:${networkId}`] },
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

const CopyEmailsButton = ({ emails }: { emails: string[] }) => {
  const { copied, copy } = useCopy();
  return (
    <Tooltip title="Copier les adresses e-mail dans le presse-papiers">
      <Button
        type="button"
        className="inline-flex items-center gap-1 text-sm"
        onClick={() => {
          copy(emails.join(', '));
          notify('success', 'Adresses copiées !');
        }}
        iconId={copied ? 'ri-check-line' : 'fr-icon-clipboard-line'}
        priority="tertiary no outline"
        size="small"
      >
        {copied ? 'Copié !' : 'Copier les adresses'}
      </Button>
    </Tooltip>
  );
};
