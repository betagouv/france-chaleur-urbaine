import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { useDialogState } from '@/hooks/useDialogState';
import { notify, toastErrors } from '@/modules/notification';
import { permissionTypeLabels } from '@/modules/permissions/constants';
import trpc from '@/modules/trpc/client';
import { formatFrenchDate } from '@/utils/date';

import type { TerritoryRef } from '../../constants';
import type { CustomTerritory, CustomTerritoryRef } from '../../types';
import CustomTerritoryFormDialog from './CustomTerritoryFormDialog';

/**
 * Admin screen of the custom territories: list, create / edit / delete, and manual refresh of the
 * `custom_territory_ids` stored on the demands (after a referential update). Granting a territory to an
 * account goes through the « Territoire personnalisé » permission on the user form, not through this screen.
 */
function AdminCustomTerritoriesPage() {
  const utils = trpc.useUtils();
  const { data: territories, isLoading } = trpc.customTerritories.admin.list.useQuery();
  type TerritoryRow = NonNullable<typeof territories>[number];
  const deleteTerritory = trpc.customTerritories.admin.delete.useMutation();
  const refreshDemands = trpc.customTerritories.admin.refreshDemands.useMutation();

  const formDialog = useDialogState<Pick<CustomTerritory, 'id' | 'name' | 'recipe'> | undefined>();
  const deleteDialog = useDialogState<CustomTerritoryRef>();

  const allRefs = (territories ?? []).flatMap((territory) => [...territory.recipe.include, ...territory.recipe.exclude]);
  const labels = trpc.permissions.resolveLabels.useQuery(
    allRefs.map((ref) => ({ resource_id: ref.code, type: ref.type })),
    { enabled: allRefs.length > 0 }
  );
  const labelByKey = useMemo(
    () => new Map(labels.data?.map((permission) => [`${permission.type}:${permission.resource_id}`, permission.label]) ?? []),
    [labels.data]
  );
  const describeRefs = (refs: TerritoryRef[]) =>
    refs.map((ref) => `${permissionTypeLabels[ref.type]} ${labelByKey.get(`${ref.type}:${ref.code}`) ?? ref.code}`).join(', ');

  const handleRefresh = toastErrors(async () => {
    const result = await refreshDemands.mutateAsync();
    notify('success', `Demandes recalculées : ${result.demands} raccordement, ${result.demands_chaleur_renouvelable} chaleur renouvelable`);
  });

  const columns: ColumnDef<TerritoryRow>[] = useMemo(
    () => [
      { accessorKey: 'name', cell: (info) => info.getValue<string>(), flex: 1, header: 'Nom' },
      {
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{describeRefs(row.original.recipe.include)}</div>
            {row.original.recipe.exclude.length > 0 && <div className="text-faded">hors {describeRefs(row.original.recipe.exclude)}</div>}
          </div>
        ),
        exportFn: (row) =>
          `${describeRefs(row.recipe.include)}${row.recipe.exclude.length > 0 ? ` hors ${describeRefs(row.recipe.exclude)}` : ''}`,
        flex: 2,
        header: 'Recette',
        id: 'recipe',
      },
      { accessorKey: 'communes_count', header: 'Communes', width: '140px' },
      { accessorKey: 'users_count', header: 'Comptes', width: '120px' },
      {
        accessorKey: 'updated_at',
        cell: (info) => formatFrenchDate(new Date(info.getValue<string>())),
        header: 'Mis à jour',
        width: '120px',
      },
      {
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button type="button" size="small" priority="tertiary" onClick={() => formDialog.open(row.original)}>
              Éditer
            </Button>
            <Button type="button" size="small" priority="tertiary" onClick={() => deleteDialog.open(row.original)}>
              Suppr.
            </Button>
          </div>
        ),
        header: 'Actions',
        id: 'actions',
        width: '180px',
      },
    ],
    [formDialog.open, deleteDialog.open, labelByKey]
  );

  return (
    <SimplePage title="Territoires personnalisés" mode="authenticated">
      <CustomTerritoryFormDialog control={formDialog} />
      <ConfirmDialog
        control={deleteDialog}
        title="Supprimer le territoire personnalisé"
        confirmLabel="Supprimer"
        danger
        onConfirm={async (territory) => {
          await deleteTerritory.mutateAsync({ id: territory.id });
          await Promise.all([utils.customTerritories.admin.list.invalidate(), utils.permissions.invalidate()]);
          notify('success', 'Territoire supprimé');
        }}
      >
        Êtes-vous sûr de vouloir supprimer <strong>{deleteDialog.data?.name}</strong> ? La permission correspondante sera retirée des
        comptes qui la détiennent et les demandes concernées ne seront plus rattachées à ce territoire.
      </ConfirmDialog>

      <Box py="4w" className="fr-container">
        <header className="flex items-baseline justify-between gap-4 flex-wrap">
          <Heading as="h1" color="blue-france">
            Territoires personnalisés
          </Heading>
          <div className="flex gap-2">
            <Button size="small" priority="tertiary" iconId="ri-refresh-line" onClick={handleRefresh} loading={refreshDemands.isPending}>
              Recalculer les demandes
            </Button>
            <Button size="small" priority="secondary" iconId="ri-add-line" onClick={() => formDialog.open(undefined)}>
              Ajouter un territoire
            </Button>
          </div>
        </header>
        <Text mb="2w">
          Périmètres sur mesure (par exemple un département hors sa métropole) : des communes incluses moins des communes exclues. Un
          territoire s'attribue à un compte via la permission «&nbsp;Territoire personnalisé&nbsp;» dans{' '}
          <a href="/admin/users">Gestion des utilisateurs</a>. Les demandes sont rattachées automatiquement à chaque enregistrement ;
          «&nbsp;Recalculer les demandes&nbsp;» sert après une mise à jour du référentiel des communes.
        </Text>
        <TableSimple
          columns={columns}
          data={territories ?? []}
          loading={isLoading}
          padding="sm"
          urlSyncKey="territoires"
          export={{ fileName: 'territoires-personnalises.xlsx', sheetName: 'Territoires' }}
        />
      </Box>
    </SimplePage>
  );
}

export default AdminCustomTerritoriesPage;
