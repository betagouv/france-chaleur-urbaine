import Tag from '@codegouvfr/react-dsfr/Tag';
import { useMemo, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import type { ColumnDef } from '@/components/ui/TableSimple';
import TableSimple from '@/components/ui/TableSimple';
import trpc from '@/modules/trpc/client';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import cx from '@/utils/cx';
import type { ReseauWithStats } from '../../types';

const initialSortingState = [{ desc: true, id: 'oldPendingDemandsCount' }];

export default function ReseauxDemandesStatsPage() {
  const { data, isLoading } = trpc.demandsLegacy.getReseauxDemandesStats.useQuery();
  const [expandedReseaux, setExpandedReseaux] = useState<Set<number>>(new Set());

  const reseauxWithStats = data?.reseaux || [];
  const globalStats = data?.globalStats || {
    reseauxAvecProblemes: 0,
    totalDemandes: 0,
    totalEnAttente: 0,
    totalEnAttente6Mois: 0,
    totalReseaux: 0,
  };

  const toggleReseau = (id: number) => {
    setExpandedReseaux((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const tableColumns: ColumnDef<ReseauWithStats>[] = useMemo(
    () => [
      {
        accessorKey: 'nom_reseau',
        cell: ({ row }) => (
          <div className="font-semibold">
            {row.original.nom_reseau || `Réseau ${row.original.id_fcu}`}
            {row.original['Identifiant reseau'] && (
              <span className="text-gray-500 text-sm ml-2">({row.original['Identifiant reseau']})</span>
            )}
          </div>
        ),
        header: 'Réseau',
        width: '250px',
      },
      {
        accessorKey: 'Gestionnaire',
        cell: ({ row }) => <div className="text-sm">{row.original.Gestionnaire || '-'}</div>,
        header: 'Gestionnaire',
        width: '200px',
      },
      {
        accessorKey: 'tags',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.length > 0 ? (
              row.original.tags.map((tag) => (
                <Tag key={tag} className="bg-blue-100 text-blue-800">
                  {tag}
                </Tag>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Aucun tag</span>
            )}
          </div>
        ),
        enableSorting: false,
        header: 'Tags',
        width: '300px',
      },
      {
        accessorFn: (row: ReseauWithStats) => {
          const total = Object.values(row.statsByStatus).reduce((sum: number, count: number) => sum + count, 0);
          return total;
        },
        cell: ({ row }) => {
          const total = Object.values(row.original.statsByStatus).reduce((sum: number, count: number) => sum + count, 0);
          return <div className="font-semibold">{total}</div>;
        },
        header: 'Total demandes',
        width: '120px',
      },
      {
        accessorFn: (row: ReseauWithStats) => row.statsByStatus[DEMANDE_STATUS.EMPTY] || 0,
        cell: ({ row }) => {
          const count = row.original.statsByStatus[DEMANDE_STATUS.EMPTY] || 0;
          return <div className={cx('font-semibold', count > 0 && 'text-orange-600')}>{count}</div>;
        },
        header: 'En attente',
        width: '120px',
      },
      {
        accessorFn: (row: ReseauWithStats) => {
          return row.tagsWithOldPendingDemands.reduce((sum: number, tagData) => sum + tagData.oldPendingDemandsCount, 0);
        },
        cell: ({ row }) => {
          const count = row.original.tagsWithOldPendingDemands.reduce((sum: number, tagData) => sum + tagData.oldPendingDemandsCount, 0);
          return <div className={cx('font-semibold', count > 0 && 'text-red-600')}>{count > 0 ? `${count} ⚠️` : '0'}</div>;
        },
        header: 'En attente > 6 mois',
        id: 'oldPendingDemandsCount',
        width: '150px',
      },
      {
        cell: ({ row }) => {
          const hasOldPending = row.original.tagsWithOldPendingDemands.some((tagData) => tagData.oldPendingDemandsCount > 0);
          const isExpanded = expandedReseaux.has(row.original.id_fcu);

          if (!hasOldPending) {
            return null;
          }

          return (
            <button
              type="button"
              onClick={() => toggleReseau(row.original.id_fcu)}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              {isExpanded ? 'Masquer' : 'Voir détails'}
            </button>
          );
        },
        header: 'Actions',
        id: 'actions',
        width: '120px',
      },
    ],
    [expandedReseaux]
  );

  // Crée une structure de données avec les détails intégrés
  const reseauxWithDetails = useMemo(() => {
    return reseauxWithStats.map((reseau) => {
      const isExpanded = expandedReseaux.has(reseau.id_fcu);
      const tagsWithOldPending = reseau.tagsWithOldPendingDemands.filter((tagData) => tagData.oldPendingDemandsCount > 0);

      return {
        ...reseau,
        _isExpanded: isExpanded,
        _tagsWithOldPending: tagsWithOldPending,
      };
    });
  }, [reseauxWithStats, expandedReseaux]);

  return (
    <SimplePage title="Statistiques réseaux et demandes" mode="authenticated">
      <div className="fr-container py-8">
        <Heading as="h1" color="blue-france" className="mb-4">
          Suivi des réseaux et demandes en attente
        </Heading>

        <CallOut title="Objectif" size="sm" className="mb-6">
          <p>
            Cet écran permet d'identifier les réseaux dont les gestionnaires ne traitent pas les demandes en attente depuis plus de 6 mois.
          </p>
          <p className="mb-0">
            Pour chaque réseau, vous pouvez voir les tags associés et les demandes éligibles qui n'ont pas eu de réponse (statut "En attente
            de prise en charge") depuis plus de 6 mois.
          </p>
        </CallOut>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total réseaux</div>
            <div className="text-2xl font-bold text-blue-600">{globalStats.totalReseaux}</div>
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
            <div className="text-sm text-gray-600">Réseaux avec problèmes</div>
            <div className="text-2xl font-bold text-yellow-600">{globalStats.reseauxAvecProblemes}</div>
          </div>
        </div>

        <div>
          <TableSimple
            columns={tableColumns}
            data={reseauxWithDetails}
            initialSortingState={initialSortingState}
            enableGlobalFilter
            controlsLayout="block"
            padding="sm"
            loading={isLoading}
          />
          {/* Détails expandables */}
          {reseauxWithDetails
            .filter((reseau) => reseau._isExpanded && reseau._tagsWithOldPending.length > 0)
            .map((reseau) => (
              <div key={reseau.id_fcu} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-3">
                  Détails des demandes en attente depuis plus de 6 mois - {reseau.nom_reseau || `Réseau ${reseau.id_fcu}`}
                </h3>
                {reseau._tagsWithOldPending.map((tagData) => (
                  <div key={tagData.tag} className="mb-4 last:mb-0">
                    <Tag className="bg-blue-100 text-blue-800 mb-2">{tagData.tag}</Tag>
                    <div className="mt-2">
                      <strong className="text-red-600">
                        {tagData.oldPendingDemands.length} demande(s) en attente depuis plus de 6 mois :
                      </strong>
                      <ul className="mt-2 space-y-2">
                        {tagData.oldPendingDemands.map((demand) => (
                          <li key={demand.id} className="text-sm bg-white p-2 rounded">
                            <span className="font-semibold">
                              {demand.Nom} {demand.Prénom}
                            </span>{' '}
                            - {demand.Adresse} -{' '}
                            <a href={`mailto:${demand.Mail}`} className="text-blue-600 hover:underline">
                              {demand.Mail}
                            </a>
                            {' - '}
                            <span className="text-gray-500">{new Date(demand['Date demandes']).toLocaleDateString('fr-FR')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </SimplePage>
  );
}
