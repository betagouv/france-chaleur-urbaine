import Tag from '@codegouvfr/react-dsfr/Tag';
import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Tooltip from '@/components/ui/Tooltip';
import { tagsGestionnairesStyleByType } from '@/modules/tags/constants';
import trpc from '@/modules/trpc/client';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import cx from '@/utils/cx';

import type { TagStats } from '../../types';

const initialSortingState = [{ desc: true, id: 'oldPendingDemandsCount' }];

export default function TagsStatsPage() {
  const { data, isLoading } = trpc.demandsLegacy.getTagsStats.useQuery();
  const tagsStats = data?.tags || [];

  const tableColumns: ColumnDef<TagStats>[] = useMemo(
    () => [
      {
        accessorKey: 'tagName',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Tag className={cx(tagsGestionnairesStyleByType[row.original.tagType as keyof typeof tagsGestionnairesStyleByType]?.className)}>
              {row.original.tagName}
            </Tag>
            {row.original.hasAlert && (
              <span className="text-red-600 font-bold" title="⚠️ 3 demandes éligibles ou plus en attente depuis plus de 6 mois">
                ⚠️
              </span>
            )}
          </div>
        ),
        header: 'Tag',
        width: '200px',
      },
      {
        accessorKey: 'tagType',
        cell: ({ row }) => {
          const type = row.original.tagType;
          const typeInfo = tagsGestionnairesStyleByType[type as keyof typeof tagsGestionnairesStyleByType];
          return type && typeInfo ? typeInfo.title : type;
        },
        filterType: 'Facets',
        header: 'Type',
        width: '150px',
      },
      {
        accessorFn: (row) => row.users.map((u) => u.email).join(' '),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.users.length > 0 ? (
              row.original.users.map((user) => (
                <Tag key={user.id} className="bg-gray-100 text-gray-800">
                  {user.email}
                </Tag>
              ))
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
        accessorFn: (row) => row.reseaux.length,
        cell: ({ row }) => {
          const reseaux = row.original.reseaux;
          if (reseaux.length === 0) {
            return <span className="text-gray-400 text-sm">Aucun réseau</span>;
          }

          const displayedReseaux = reseaux.slice(0, 2);
          const remainingReseaux = reseaux.slice(2);

          return (
            <div className="flex flex-wrap gap-1 items-center">
              {displayedReseaux.map((reseau) => (
                <Tag key={reseau.id_fcu} className="bg-blue-100 text-blue-800">
                  {reseau.nom_reseau || `Réseau ${reseau.id_fcu}`}
                </Tag>
              ))}
              {remainingReseaux.length > 0 && (
                <Tooltip
                  title={
                    <div>
                      <div className="font-semibold mb-2">Autres réseaux ({remainingReseaux.length}) :</div>
                      <ul className="list-disc list-inside space-y-1">
                        {remainingReseaux.map((reseau) => (
                          <li key={reseau.id_fcu} className="text-sm">
                            {reseau.nom_reseau || `Réseau ${reseau.id_fcu}`}
                            {reseau['Identifiant reseau'] && <span className="text-gray-400 ml-1">({reseau['Identifiant reseau']})</span>}
                          </li>
                        ))}
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
        enableSorting: false,
        header: 'Réseaux',
        width: '250px',
      },
      {
        accessorKey: 'totalDemandes',
        cell: ({ row }) => <div className="font-semibold">{row.original.totalDemandes}</div>,
        header: 'Total demandes',
        width: '120px',
      },
      {
        accessorFn: (row) => row.statsByStatus[DEMANDE_STATUS.EMPTY] || 0,
        cell: ({ row }) => {
          const count = row.original.statsByStatus[DEMANDE_STATUS.EMPTY] || 0;
          return <div className={cx('font-semibold', count > 0 && 'text-orange-600')}>{count}</div>;
        },
        header: 'En attente',
        width: '120px',
      },
      {
        accessorFn: (row) => row.statsByStatus[DEMANDE_STATUS.IN_PROGRESS] || 0,
        cell: ({ row }) => {
          const count = row.original.statsByStatus[DEMANDE_STATUS.IN_PROGRESS] || 0;
          return <div className="font-semibold">{count}</div>;
        },
        header: 'En cours',
        width: '120px',
      },
      {
        accessorFn: (row) => row.statsByStatus[DEMANDE_STATUS.DONE] || 0,
        cell: ({ row }) => {
          const count = row.original.statsByStatus[DEMANDE_STATUS.DONE] || 0;
          return <div className="font-semibold">{count}</div>;
        },
        header: 'Réalisé',
        width: '120px',
      },
      {
        accessorKey: 'oldPendingDemandsCount',
        cell: ({ row }) => {
          const count = row.original.oldPendingDemandsCount;
          return <div className={cx('font-semibold', count > 0 && 'text-red-600')}>{count > 0 ? `${count} ⚠️` : '0'}</div>;
        },
        header: 'En attente > 6 mois',
        width: '150px',
      },
    ],
    []
  );

  // Calcule les statistiques globales
  const globalStats = useMemo(() => {
    const totalTags = tagsStats.length;
    const totalDemandes = tagsStats.reduce((sum, tag) => sum + tag.totalDemandes, 0);
    const totalEnAttente = tagsStats.reduce((sum, tag) => sum + (tag.statsByStatus[DEMANDE_STATUS.EMPTY] || 0), 0);
    const totalEnAttente6Mois = tagsStats.reduce((sum, tag) => sum + tag.oldPendingDemandsCount, 0);
    const tagsAvecAlerte = tagsStats.filter((tag) => tag.hasAlert).length;

    return {
      tagsAvecAlerte,
      totalDemandes,
      totalEnAttente,
      totalEnAttente6Mois,
      totalTags,
    };
  }, [tagsStats]);

  return (
    <SimplePage title="Statistiques par tag" mode="authenticated" layout="large">
      <Heading as="h1" color="blue-france" className="mb-4">
        Statistiques par tag gestionnaire
      </Heading>

      <CallOut title="Objectif" size="sm" className="mb-6">
        <p>
          Cet écran permet de voir pour chaque tag : les utilisateurs gestionnaires associés, les réseaux associés, et les statistiques des
          demandes.
        </p>
        <p className="mb-0">Un indicateur ⚠️ apparaît si le tag est lié à au moins 3 demandes éligibles en attente depuis plus de 6 mois.</p>
      </CallOut>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total tags</div>
          <div className="text-2xl font-bold text-blue-600">{globalStats.totalTags}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total demandes</div>
          <div className="text-2xl font-bold">{globalStats.totalDemandes}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">En attente</div>
          <div className="text-2xl font-bold text-orange-600">{globalStats.totalEnAttente}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">En attente &gt; 6 mois</div>
          <div className="text-2xl font-bold text-red-600">{globalStats.totalEnAttente6Mois}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Tags avec alerte</div>
          <div className="text-2xl font-bold text-yellow-600">{globalStats.tagsAvecAlerte}</div>
        </div>
      </div>

      <TableSimple
        columns={tableColumns}
        data={tagsStats}
        initialSortingState={initialSortingState}
        enableGlobalFilter
        controlsLayout="block"
        padding="sm"
        loading={isLoading}
      />
    </SimplePage>
  );
}
