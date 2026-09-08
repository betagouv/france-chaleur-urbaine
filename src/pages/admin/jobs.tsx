import type { SortingState } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';

import JobStatusBadge from '@/components/Admin/JobStatusBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import { useDelete, useFetch, usePost } from '@/hooks/useApi';
import { useDialogState } from '@/hooks/useDialogState';
import { cells } from '@/modules/data-table/cells';
import { DataTable } from '@/modules/data-table/DataTable';
import type { DataTableColumn } from '@/modules/data-table/types';
import { useDataTable } from '@/modules/data-table/useDataTable';
import { toastErrors } from '@/modules/notification';
import type { AdminJobItem } from '@/pages/api/admin/jobs';
import type { JobDownload } from '@/pages/api/admin/jobs/[id]/download';
import { withAuthentication } from '@/server/authentication';
import { downloadString } from '@/utils/browser';
import { fetchJSON } from '@/utils/network';

const initialSorting: SortingState = [{ desc: true, id: 'updated_at' }];

// Shape of the JSON `result` column written by the job runners (error, or timing + optional import stats).
type JobResult = { error: string } | { duration: number; stats?: { insertedCount?: number; updatedCount?: number } };

const emptyJobs: AdminJobItem[] = [];
const getRowId = (row: AdminJobItem) => row.id;

const downloadJobFile = toastErrors(async (jobId: string) => {
  const job = await fetchJSON<JobDownload>(`/api/admin/jobs/${jobId}/download`);
  downloadString((job.data as any).content || (job.data as any) /** deprecated */.csvContent, `jobs-fcu-${jobId}.csv`, 'text/csv');
});

export default function ManageJobs() {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);
  const { data: jobs, isLoading } = useFetch<AdminJobItem[]>('/api/admin/jobs', undefined, {
    refetchInterval: hasPendingJobs ? 5000 : 60000,
  });
  const { mutateAsync: resetJob } = usePost<{ id: string }>(({ id }) => `/api/admin/jobs/${id}/reset`, { invalidate: ['/api/admin/jobs'] });
  const { mutateAsync: deleteJob } = useDelete<{ id: string }>(({ id }) => `/api/admin/jobs/${id}`, { invalidate: ['/api/admin/jobs'] });
  const deleteDialog = useDialogState<AdminJobItem>();

  useEffect(() => {
    setHasPendingJobs(jobs?.some((job) => job.status === 'pending' || job.status === 'processing') ?? false);
  }, [jobs]);

  const columns = useMemo<DataTableColumn<AdminJobItem>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', sortable: false, width: 120 },
      {
        accessorKey: 'type',
        cell: ({ row, value }) => (
          <div className="flex flex-col gap-1 leading-tight">
            <span>{value}</span>
            {row.data_name && <span className="text-xs text-faded truncate">{row.data_name}</span>}
          </div>
        ),
        header: 'Type',
      },
      { accessorKey: 'status', cell: ({ value }) => <JobStatusBadge status={value} />, header: 'Statut', width: 130 },
      {
        accessorKey: 'result',
        cell: ({ row, value }) => {
          const result = value as JobResult | null; // JSON column: no type beyond JsonValue on the API
          if (!result) {
            return null;
          }
          if ('error' in result) {
            return <span className="text-(--text-default-error)">{result.error}</span>;
          }
          return (
            <div className="flex flex-col leading-tight text-sm">
              <span>Durée : {Math.round(result.duration / 100) / 10}s</span>
              {row.type === 'pro_eligibility_test' && (
                <>
                  <span>Adresses créées : {result.stats?.insertedCount ?? 0}</span>
                  <span>Adresses mises à jour : {result.stats?.updatedCount ?? 0}</span>
                </>
              )}
            </div>
          );
        },
        header: 'Résultat',
        sortable: false,
        width: '25%',
      },
      {
        accessorFn: (row) => row.user?.email ?? null,
        cell: ({ value }) => (typeof value === 'string' ? value : <span className="text-faded">Système</span>),
        header: 'Utilisateur',
        id: 'user_email',
      },
      { accessorKey: 'created_at', cell: cells.dateTime(), header: 'Créée le', width: 110 },
      { accessorKey: 'updated_at', cell: cells.dateTime(), header: 'Mise à jour le', width: 110 },
      {
        align: 'right',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              size="small"
              priority="tertiary"
              iconId="fr-icon-download-line"
              title="Télécharger le fichier"
              onClick={() => downloadJobFile(row.id)}
            />
            <Button
              size="small"
              priority="tertiary"
              iconId="fr-icon-refresh-line"
              title="Réinitialiser la tâche"
              onClick={toastErrors(async () => {
                await resetJob({ id: row.id });
              })}
            />
            <Button
              size="small"
              priority="tertiary"
              variant="destructive"
              iconId="fr-icon-delete-bin-line"
              title="Supprimer la tâche"
              onClick={() => deleteDialog.open(row)}
            />
          </div>
        ),
        export: false,
        header: '',
        headerLabel: 'Actions',
        id: 'actions',
        width: 130,
      },
    ],
    [resetJob, deleteDialog.open]
  );

  const table = useDataTable({ columns, data: jobs ?? emptyJobs, getRowId, initialSorting });

  return (
    <SimplePage title="Suivi des tâches" mode="authenticated">
      <ConfirmDialog
        control={deleteDialog}
        title="Supprimer la tâche"
        confirmLabel="Supprimer"
        danger
        onConfirm={async (job) => {
          await deleteJob(job.id);
        }}
      >
        Êtes-vous sûr de vouloir supprimer la tâche <strong>{deleteDialog.data?.id}</strong> ?
      </ConfirmDialog>
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Suivi des tâches
        </Heading>

        <Text className="fr-mb-4w">
          Cette page permet de suivre l'avancement des tâches de test d'éligibilité des utilisateurs professionnels. Si une tâche est en
          erreur, alors on peut la réinitialiser pour relancer le traitement.
        </Text>
        <DataTable table={table} loading={isLoading} rowHeight="lg" />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
