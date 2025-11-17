import { Input } from '@codegouvfr/react-dsfr/Input';
import Tag from '@codegouvfr/react-dsfr/Tag';
import type { Row } from '@tanstack/react-table';
import { useState } from 'react';

import Select, { type SelectOption } from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import useCrud from '@/hooks/useCrud';
import { toastErrors } from '@/modules/notification';
import cx from '@/utils/cx';
import { compareFrenchStrings } from '@/utils/strings';

import { tagsGestionnairesStyleByType } from '../../constants';
import type { TagsResponse } from '../../server/api-admin';
import type { TagWithUsers } from '../../server/service';

const initialSortingState = [{ desc: false, id: 'name' }];

const tagTypeOptions: SelectOption[] = [
  { label: 'Sélectionner un type', value: '' },
  { label: 'Ville', value: 'ville' },
  { label: 'Métropole', value: 'metropole' },
  { label: 'Gestionnaire tête de réseau', value: 'gestionnaire' },
  { label: 'Réseau spécifique', value: 'reseau' },
];

export default function ManageTags() {
  const {
    items: tags,
    isLoading,
    create,
    update: updateCrud,
    delete: deleteCrud,
  } = useCrud<TagsResponse, TagWithUsers[]>('/api/admin/tags');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagWithUsers | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagWithUsers | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editTagName, setEditTagName] = useState('');
  const [newTagType, setNewTagType] = useState<string>('');
  const [editTagType, setEditTagType] = useState<string>('');

  const tableColumns: ColumnDef<TagWithUsers>[] = [
    {
      accessorKey: 'name',
      cell: (info) => (
        <Tag className={cx(tagsGestionnairesStyleByType[info.row.original.type as keyof typeof tagsGestionnairesStyleByType]?.className)}>
          {info.getValue()}
        </Tag>
      ),
      className: 'break-words break-all',
      header: 'Nom',
      sortingFn: (rowA: Row<TagWithUsers>, rowB: Row<TagWithUsers>) => compareFrenchStrings(rowA.original.name, rowB.original.name),
    },
    {
      accessorKey: 'type',
      cell: (info) => {
        const type = info.getValue() as string;
        const typeInfo = tagsGestionnairesStyleByType[type as keyof typeof tagsGestionnairesStyleByType];
        return type && typeInfo ? typeInfo.title : '';
      },
      filterType: 'Facets',
      header: 'Type',
      width: '150px',
    },
    {
      accessorFn: (row) => row.users.map((u) => u.email.toLowerCase()).join(' '),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.users.map((user) => (
            <Tag key={user.id}>{user.email}</Tag>
          ))}
        </div>
      ),
      enableSorting: false,
      flex: 3,
      header: 'Gestionnaires associés',
      id: 'users',
    },
    {
      accessorKey: 'created_at',
      cellType: 'Date',
      header: 'Créé le',
    },
    {
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
              setEditTagType(row.original.type);
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
      header: 'Actions',
      id: 'actions',
      width: '120px',
    },
  ];

  const handleCreate = toastErrors(
    async () => {
      if (!newTagName.trim()) return;
      await create({ name: newTagName.trim(), type: newTagType });
      resetCreateDialog();
    },
    (err: any) => (err.code === 'unique_constraint_violation' ? 'Ce tag existe déjà' : err.message)
  );

  const handleEdit = toastErrors(async () => {
    if (!editingTag || !editTagName.trim()) return;
    await updateCrud(editingTag.id, { name: editTagName.trim(), type: editTagType });
    resetEditDialog();
  });

  const handleDelete = toastErrors(async () => {
    if (!deletingTag) return;
    await deleteCrud(deletingTag.id);
    setDeletingTag(null);
    setIsDeleteDialogOpen(false);
  });

  const resetCreateDialog = () => {
    setNewTagName('');
    setNewTagType('');
    setIsCreateDialogOpen(false);
  };

  const resetEditDialog = () => {
    setEditTagName('');
    setEditTagType('');
    setEditingTag(null);
    setIsEditDialogOpen(false);
  };

  return (
    <SimplePage title="Gestion des tags" mode="authenticated">
      <Box py="4w" className="fr-container">
        <div className="flex justify-between items-center mb-4">
          <Heading as="h1" color="blue-france">
            Gestion des tags gestionnaires
          </Heading>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Ajouter un tag</Button>
        </div>

        <CallOut title="Tags gestionnaires" size="sm">
          <p>Les tags sont utilisés pour mettre en relation les demandes déposées avec les gestionnaires.</p>
          <ul className="mb-0">
            <li>Les tags listés ici sont associés à des utilisateurs qui sont actifs.</li>
            <li>Chaque tag est associé à un type de tag (ville, métropole, gestionnaire tête de réseau, réseau spécifique).</li>
            <li>Les couleurs sont indicatives et ne servent que comme indicateur visuel.</li>
            <li>
              Lorsqu'une demande est déposée, le champ <strong>Gestionnaires</strong> propose des suggestions de tags en fonction d'un
              algorithme prédéfini :
              <ul className="mb-0">
                <li>
                  <strong>Ville</strong> : le tag de la ville de la demande est affecté automatiquement.
                </li>
                <li>
                  <strong>Métropole</strong> : le tag de la métropole (ou CA ou CU) liée à la ville est affecté s'il existe dans la liste
                  des tags (format : NomVille + M).
                </li>
                <li>
                  <strong>Tags réseaux</strong> : les tags sont récupérés automatiquement depuis le réseau le plus proche selon
                  l'éligibilité.
                </li>
              </ul>
            </li>
          </ul>
        </CallOut>

        <TableSimple
          columns={tableColumns}
          data={tags || []}
          initialSortingState={initialSortingState}
          enableGlobalFilter
          controlsLayout="block"
          padding="sm"
          loading={isLoading}
          urlSyncKey="tags"
          export={{
            fileName: 'tags.xlsx',
            sheetName: 'tags',
          }}
        />
      </Box>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} title="Ajouter un tag" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Nom du tag"
            nativeInputProps={{
              onChange: (e) => setNewTagName(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleCreate(),
              value: newTagName,
            }}
          />
          <Select
            label="Type du tag"
            options={tagTypeOptions}
            nativeSelectProps={{
              onChange: (e) => setNewTagType(e.target.value),
              value: newTagType,
            }}
          />
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={resetCreateDialog}>
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
            label="Nom"
            nativeInputProps={{
              onChange: (e) => setEditTagName(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleEdit(),
              value: editTagName,
            }}
          />
          <Select
            label="Type"
            options={tagTypeOptions}
            nativeSelectProps={{
              onChange: (e) => setEditTagType(e.target.value),
              value: editTagType,
            }}
          />
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={resetEditDialog}>
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
