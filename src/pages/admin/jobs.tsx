import { type SortingState } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import JobStatusBadge from '@/components/Admin/JobStatusBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Text from '@/components/ui/Text';
import { useDelete, useFetch, usePost } from '@/hooks/useApi';
import { toastErrors } from '@/modules/notification';
import { type AdminJobItem } from '@/pages/api/admin/jobs';
import { type JobDownload } from '@/pages/api/admin/jobs/[id]/download';
import { withAuthentication } from '@/server/authentication';
import { downloadString } from '@/utils/browser';
import { fetchJSON } from '@/utils/network';

const columns: ColumnDef<AdminJobItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false,
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: (info) => <JobStatusBadge status={info.getValue()} />,
  },
  {
    accessorKey: 'result',
    header: 'Résultat',
    cell: (info) => {
      const result = info.getValue();
      if (!result) return null;

      if ('error' in result) {
        return <Text color="error">{result.error}</Text>;
      }

      return (
        <Box>
          <Text>Durée : {Math.round(result.duration / 100) / 10}s</Text>
          <Text>Adresses créées : {result.stats?.insertedCount}</Text>
          <Text>Adresses mises à jour : {result.stats?.updatedCount}</Text>
        </Box>
      );
    },
    flex: 2,
    enableSorting: false,
  },
  {
    accessorKey: 'user.email',
    header: 'Utilisateur',
  },
  {
    accessorKey: 'created_at',
    header: 'Créée le',
    cellType: 'DateTime',
  },
  {
    accessorKey: 'updated_at',
    header: 'Mise à jour le',
    cellType: 'DateTime',
  },
  {
    accessorKey: '_id',
    header: '',
    align: 'right',
    cell: (info) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { mutateAsync: resetJob } = usePost(`/api/admin/jobs/${info.row.original.id}/reset`, {
        invalidate: ['/api/admin/jobs'],
      });
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { mutateAsync: deleteJob } = useDelete(`/api/admin/jobs/${info.row.original.id}`, {
        invalidate: ['/api/admin/jobs'],
      });

      return (
        <>
          <Button
            size="small"
            priority="tertiary"
            iconId="fr-icon-download-line"
            title="Télécharger le fichier"
            onClick={toastErrors(async () => {
              const job = await fetchJSON<JobDownload>(`/api/admin/jobs/${info.row.original.id}/download`);
              downloadString(
                (job.data as any).content || (job.data as any) /** deprecated */.csvContent,
                `jobs-fcu-${info.row.original.id}.csv`,
                'text/csv'
              );
            })}
          />
          <Button
            size="small"
            priority="tertiary"
            iconId="fr-icon-refresh-line"
            title="Réinitialiser la tâche"
            onClick={toastErrors(async () => {
              await resetJob({});
            })}
          />
          <Button
            size="small"
            priority="tertiary"
            variant="destructive"
            iconId="fr-icon-delete-bin-line"
            title="Supprimer la tâche"
            onClick={toastErrors(async () => {
              if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                return;
              }
              await deleteJob(info.row.original.id);
            })}
          />
        </>
      );
    },
    enableSorting: false,
  },
];

const initialSortingState: SortingState = [
  {
    id: 'updated_at',
    desc: true,
  },
];

export default function ManageJobs() {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);
  const { data: jobs, isLoading } = useFetch<AdminJobItem[]>('/api/admin/jobs', undefined, {
    refetchInterval: hasPendingJobs ? 5000 : 60000,
  });

  useEffect(() => {
    setHasPendingJobs(jobs?.some((job) => job.status == 'pending' || job.status == 'processing') ?? false);
  }, [jobs]);

  return (
    <SimplePage title="Suivi des tâches" mode="authenticated">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Suivi des tâches
        </Heading>

        <Text className="fr-mb-4w">
          Cette page permet de suivre l'avancement des tâches de test d'éligibilité des utilisateurs professionnels. Si une tâche est en
          erreur, alors on peut la réinitialiser pour relancer le traitement.
        </Text>
        <TableSimple columns={columns} data={jobs || []} initialSortingState={initialSortingState} enableGlobalFilter loading={isLoading} />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
