import { Input } from '@codegouvfr/react-dsfr/Input';
import { type Row } from '@tanstack/react-table';
import { useState } from 'react';

import Tag from '@/components/Manager/Tag';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import useCrud from '@/hooks/useCrud';
import { type TagsResponse } from '@/pages/api/admin/tags/[[...slug]]';
import { withAuthentication } from '@/server/authentication';
import { type TagWithUsers } from '@/server/services/tags';
import { toastErrors } from '@/services/notification';
import { compareFrenchStrings } from '@/utils/strings';

const initialSortingState = [{ id: 'name', desc: false }];

export default function ManageTags() {
  const { items: tags, create, update: updateCrud, delete: deleteCrud, isLoading } = useCrud<TagsResponse>('/api/admin/tags');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagWithUsers | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagWithUsers | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editTagName, setEditTagName] = useState('');

  const tableColumns: ColumnDef<TagWithUsers>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      sortingFn: (rowA: Row<TagWithUsers>, rowB: Row<TagWithUsers>) => compareFrenchStrings(rowA.original.name, rowB.original.name),
      cell: (info: { getValue: () => string }) => <Tag text={info.getValue()} />,
      className: 'break-words break-all',
    },
    {
      accessorFn: (row) => row.users.map((u) => u.email.toLowerCase()).join(' '),
      id: 'users',
      header: 'Gestionnaires associés',
      flex: 3,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.users.map((user) => (
            <Tag key={user.id} text={user.email} />
          ))}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'created_at',
      header: 'Créé le',
      cellType: 'Date',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="small"
            priority="tertiary"
            iconId="fr-icon-edit-line"
            title="Modifier le tag"
            onClick={() => {
              setEditingTag(row.original);
              setEditTagName(row.original.name);
              setIsEditDialogOpen(true);
            }}
          />
          <Button
            size="small"
            priority="tertiary"
            variant="destructive"
            iconId="fr-icon-delete-bin-line"
            title="Supprimer le tag"
            onClick={() => {
              setDeletingTag(row.original);
              setIsDeleteDialogOpen(true);
            }}
          />
        </div>
      ),
      width: '120px',
    },
  ];

  const handleCreate = toastErrors(
    async () => {
      if (!newTagName.trim()) return;
      await create({ name: newTagName.trim() });
      setNewTagName('');
      setIsCreateDialogOpen(false);
    },
    (err: any) => (err.code === 'unique_constraint_violation' ? 'Ce tag existe déjà' : err.message)
  );

  const handleEdit = toastErrors(async () => {
    if (!editingTag || !editTagName.trim()) return;
    await updateCrud(editingTag.id, { name: editTagName.trim() });
    setEditTagName('');
    setEditingTag(null);
    setIsEditDialogOpen(false);
  });

  const handleDelete = toastErrors(async () => {
    if (!deletingTag) return;
    await deleteCrud(deletingTag.id);
    setDeletingTag(null);
    setIsDeleteDialogOpen(false);
  });

  return (
    <SimplePage title="Gestion des tags" mode="authenticated">
      <Box py="4w" className="fr-container">
        <div className="flex justify-between items-center mb-4">
          <Heading as="h1" color="blue-france">
            Gestion des tags gestionnaires
          </Heading>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Ajouter un tag</Button>
        </div>

        <TableSimple
          columns={tableColumns}
          data={tags as any as TagWithUsers[]}
          initialSortingState={initialSortingState}
          enableGlobalFilter
          controlsLayout="block"
          padding="sm"
          loading={isLoading}
        />
      </Box>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} title="Ajouter un tag" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Nom du tag"
            nativeInputProps={{
              value: newTagName,
              onChange: (e) => setNewTagName(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleCreate(),
            }}
          />
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Créer</Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title="Modifier le tag" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Nom du tag"
            nativeInputProps={{
              value: editTagName,
              onChange: (e) => setEditTagName(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleEdit(),
            }}
          />
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit}>Modifier</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Supprimer le tag" size="sm">
        <div className="flex flex-col gap-4">
          <p>Êtes-vous sûr de vouloir supprimer le tag "{deletingTag?.name}" ?</p>
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Dialog>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
