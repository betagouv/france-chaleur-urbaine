import Tag from '@codegouvfr/react-dsfr/Tag';
import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { tagsGestionnairesStyleByType } from '@/modules/tags/constants';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';
import { compareFrenchStrings } from '@/utils/strings';
import type { TagsStats } from '../../types';

const initialSortingState = [{ desc: true, id: 'lastSixMonths' }];

export default function TagsStatsPage() {
  const { data: tagsStats, isLoading } = trpc.demandsLegacy.getTagsStats.useQuery();

  const tableColumns: ColumnDef<TagsStats>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        cell: ({ row }) => (
          <Tag className={cx(tagsGestionnairesStyleByType[row.original.name as keyof typeof tagsGestionnairesStyleByType]?.className)}>
            {row.original.name}
          </Tag>
        ),
        header: 'Tag',
        width: '200px',
      },
      {
        accessorKey: 'type',
        cell: ({ row }) => {
          const type = row.original.type;
          const typeInfo = tagsGestionnairesStyleByType[type as keyof typeof tagsGestionnairesStyleByType];
          return type && typeInfo ? typeInfo.title : type;
        },
        filterType: 'Facets',
        header: 'Type',
        width: '150px',
      },
      {
        accessorFn: (row) => row.users.map((u: { email: string }) => u.email).join(' '),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.users.length > 0 ? (
              row.original.users.map((user: { id: number; email: string; last_connection: string | null }) => {
                const lastConnection = formatDate(user.last_connection);
                const lastConnectionClassName = getLastConnectionClassName(user.last_connection);
                return (
                  <Tag key={user.id} className="bg-gray-100 text-gray-800">
                    <div className="flex flex-col leading-tight">
                      <span>{user.email}</span>
                      {lastConnection && (
                        <span className={`text-[11px] ${lastConnectionClassName}`}>Dernière connexion {lastConnection}</span>
                      )}
                    </div>
                  </Tag>
                );
              })
            ) : (
              <span className="text-gray-400 text-sm">Aucun utilisateur</span>
            )}
          </div>
        ),
        enableSorting: false,
        header: 'Utilisateurs gestionnaires',
        width: '250px',
      },
      {
        accessorFn: (row) =>
          row.reseaux.map((reseau) => `${reseau.id_fcu}${reseau.nom_reseau || ''}${reseau['Identifiant reseau'] || ''}`).join(' | '),
        cell: ({ row }) => {
          const reseaux = row.original.reseaux;
          if (reseaux.length === 0) {
            return <span className="text-gray-400 text-sm">Aucun réseau</span>;
          }

          const displayedReseaux = reseaux.slice(0, 2);
          const remainingReseaux = reseaux.slice(2);

          return (
            <div className="flex flex-wrap gap-1 items-center">
              {displayedReseaux.map((reseau: { id_fcu: number; nom_reseau: string | null; 'Identifiant reseau': string | null }) => (
                <Tag key={reseau.id_fcu} className="bg-blue-100 text-blue-800">
                  <div className="flex flex-col leading-tight">
                    <span>{getReseauDisplayLabel(reseau)}</span>
                  </div>
                </Tag>
              ))}
              {remainingReseaux.length > 0 && (
                <Tooltip
                  title={
                    <div>
                      <div className="font-semibold mb-2">Autres réseaux ({remainingReseaux.length}) :</div>
                      <ul className="list-disc list-inside space-y-1">
                        {remainingReseaux.map(
                          (reseau: { id_fcu: number; nom_reseau: string | null; 'Identifiant reseau': string | null }) => (
                            <li key={reseau.id_fcu} className="text-sm">
                              <span className="font-medium">{getReseauDisplayLabel(reseau)}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  }
                >
                  <span className="text-blue-600 hover:text-blue-800 underline cursor-help text-sm">
                    + {remainingReseaux.length} autre{remainingReseaux.length > 1 ? 's' : ''} réseau{remainingReseaux.length > 1 ? 'x' : ''}
                  </span>
                </Tooltip>
              )}
            </div>
          );
        },
        header: 'Réseaux',
        id: 'reseaux',
        sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.getValue('reseaux'), rowB.getValue('reseaux')),
        width: '250px',
      },
      {
        accessorFn: (row) => row.lastSixMonths.pending,
        accessorKey: 'lastSixMonths',
        cell: ({ row }) => {
          const { pending, total } = row.original.lastSixMonths;
          return (
            <>
              {pending} / {total}
            </>
          );
        },
        header: '< 6 mois',
        width: '120px',
      },
      {
        accessorFn: (row) => row.lastThreeMonths.pending,
        accessorKey: 'lastThreeMonths',
        cell: ({ row }) => {
          const { pending, total } = row.original.lastThreeMonths;
          return (
            <>
              {pending} / {total}
            </>
          );
        },
        header: '< 3 mois',
        width: '120px',
      },
      {
        accessorFn: (row) => row.lastOneMonth.pending,
        accessorKey: 'lastOneMonth',
        cell: ({ row }) => {
          const { pending, total } = row.original.lastOneMonth;
          return (
            <>
              {pending} / {total}
            </>
          );
        },
        header: '< 1 mois',
        width: '120px',
      },
    ],
    []
  );

  return (
    <SimplePage title="Statistiques par tag" mode="authenticated" layout="large">
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
        enableGlobalFilter
        controlsLayout="block"
        padding="sm"
        loading={isLoading}
        export={{
          fileName: 'tags_stats.xlsx',
          sheetName: 'tags_stats',
        }}
      />
    </SimplePage>
  );
}

// Utilitaires
const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

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

const getReseauDisplayLabel = (reseau: TagsStats['reseaux'][number]) => {
  return `${reseau.nom_reseau || `Réseau ${reseau.id_fcu}`}${reseau['Identifiant reseau'] ? ` (${reseau['Identifiant reseau']})` : ''}`;
};
