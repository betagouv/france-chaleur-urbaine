import { useState } from 'react';

import CreateAssignmentRuleDialog from '@/components/assignment-rules/CreateAssignmentRuleDialog';
import EditAssignmentRuleDialog from '@/components/assignment-rules/EditAssignmentRuleDialog';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import useCrud from '@/hooks/useCrud';
import { type AssignmentRulesResponse } from '@/pages/api/admin/assignment-rules/[[...slug]]';
import { withAuthentication } from '@/server/authentication';
import { type AssignmentRule } from '@/server/services/assignment-rules';
import { toastErrors } from '@/services/notification';
import cx from '@/utils/cx';

const initialSortingState = [{ id: 'search_pattern', desc: false }];

export default function ManageAssignmentRules() {
  const {
    items: rules,
    isLoading,
    create,
    update: updateCrud,
    delete: deleteCrud,
  } = useCrud<AssignmentRulesResponse>('/api/admin/assignment-rules');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<AssignmentRule | null>(null);

  const tableColumns: ColumnDef<AssignmentRule>[] = [
    {
      accessorKey: 'search_pattern',
      header: 'Conditions',
      cell: (info) => <div className="bg-zinc-50 px-1 py-[0.1rem] rounded-sm font-mono text-sm">{info.getValue()}</div>,
      className: 'break-words',
      flex: 2,
    },
    {
      accessorKey: 'result',
      header: 'Actions',
      cell: (info) => <div className="font-mono bg-blue-50 px-2 py-1 rounded text-sm">{info.getValue()}</div>,
      className: 'break-words',
    },
    {
      accessorKey: 'active',
      header: 'Statut',
      cell: (info) => (
        <span
          className={cx(
            'px-2 py-1 rounded text-xs font-medium',
            info.getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          )}
        >
          {info.getValue() ? 'Actif' : 'Inactif'}
        </span>
      ),
      width: '100px',
      filterType: 'Facets',
      align: 'center',
    },
    {
      accessorKey: 'created_at',
      header: 'Créé le',
      cellType: 'Date',
      width: '100px',
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="small"
            priority="tertiary"
            iconId="fr-icon-edit-line"
            title="Modifier la règle"
            onClick={() => {
              setEditingRule(row.original);
              setIsEditDialogOpen(true);
            }}
          />
          <Button
            size="small"
            priority="tertiary"
            variant="destructive"
            iconId="fr-icon-delete-bin-line"
            title="Supprimer la règle"
            onClick={() => {
              setDeletingRule(row.original);
              setIsDeleteDialogOpen(true);
            }}
          />
        </div>
      ),
      width: '120px',
    },
  ];

  const handleDelete = toastErrors(async () => {
    if (!deletingRule) return;
    await deleteCrud(deletingRule.id);
    setDeletingRule(null);
    setIsDeleteDialogOpen(false);
  });

  return (
    <SimplePage title="Gestion des règles d'affectation" mode="authenticated">
      <Box py="4w" className="fr-container">
        <div className="flex justify-between items-center mb-4">
          <Heading as="h1" color="blue-france">
            Gestion des règles dynamiques
          </Heading>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Ajouter une règle</Button>
        </div>

        <CallOut title="Règles dynamiques" size="sm">
          <p>
            Les règles dynamiques permettent d'automatiser l'ajout de tags et l'affectation des demandes selon des critères complexes basés
            sur les données d'éligibilité.
          </p>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Conditions disponibles :</h4>
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-sm [&_code]:font-mono">
                <li>
                  <code>tag:"pattern"</code> : cherche dans les tags gestionnaires
                </li>
                <li>
                  <code>commune.nom:"Paris"</code> : nom de la commune
                </li>
                <li>
                  <code>commune.insee_dep:"94"</code> : code département
                </li>
                <li>
                  <code>commune.insee_reg:"11"</code> : code région
                </li>
                <li>
                  <code>type:"dans_pdp"</code> : type d'éligibilité
                </li>
                <li>
                  <code>distance:"0"</code> : distance au réseau
                </li>
                <li>
                  <code>nom:"Réseau*"</code> : nom du réseau
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Opérateurs logiques :</h4>
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-sm [&_code]:font-mono">
                <li>
                  <code>&&</code> (ET), <code>||</code> (OU), <code>!</code> (NON), parenthèses <code>()</code>
                </li>
                <li>
                  Jokers : <code>*</code> pour correspondances partielles
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Actions disponibles :</h4>
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-sm [&_code]:font-mono">
                <li>
                  <code>tag:"MonTag"</code> : ajoute un tag
                </li>
                <li>
                  <code>affecte:"Gestionnaire"</code> : affecte à un gestionnaire
                </li>
                <li>
                  Plusieurs actions possibles : <code>tag:"Tag1" tag:"Tag2" affecte:"Gestionnaire"</code>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Exemples :</h4>
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-sm [&_code]:font-mono">
                <li>
                  <code>commune.insee_dep:"94"</code> → <code>tag:"Val-de-Marne"</code>
                </li>
                <li>
                  <code>tag:"ENGIE*" && type:"dans_pdp"</code> → <code>affecte:"ENGIE"</code>
                </li>
                <li>
                  <code>commune.nom:"Paris" || commune.nom:"Lyon"</code> → <code>tag:"Grande_Ville"</code>
                </li>
              </ul>
            </div>
          </div>
        </CallOut>

        <TableSimple
          columns={tableColumns}
          data={rules as unknown as AssignmentRule[]}
          initialSortingState={initialSortingState}
          enableGlobalFilter
          controlsLayout="block"
          padding="sm"
          loading={isLoading}
        />
      </Box>

      <CreateAssignmentRuleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={async (data) => {
          await create(data);
        }}
      />

      <EditAssignmentRuleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        rule={editingRule}
        onUpdate={async (id, data) => {
          await updateCrud(id, data);
        }}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Supprimer la règle" size="sm">
        <div className="flex flex-col gap-4">
          <p>Êtes-vous sûr de vouloir supprimer la règle avec les conditions "{deletingRule?.search_pattern}" ?</p>
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
