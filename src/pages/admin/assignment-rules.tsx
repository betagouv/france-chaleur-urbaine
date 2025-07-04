import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';

import ExpressionTester from '@/components/assignment-rules/ExpressionTester';
import ExpressionValidator from '@/components/assignment-rules/ExpressionValidator';
import Checkbox from '@/components/form/dsfr/Checkbox';
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
import { validateExpression } from '@/utils/expression-parser';

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
  const [newSearchPattern, setNewSearchPattern] = useState('');
  const [editSearchPattern, setEditSearchPattern] = useState('');
  const [newResult, setNewResult] = useState('');
  const [editResult, setEditResult] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [editActive, setEditActive] = useState(true);

  const tableColumns: ColumnDef<AssignmentRule>[] = [
    {
      accessorKey: 'search_pattern',
      header: 'Motif de recherche',
      cell: (info) => <div className="font-mono px-2 py-1 rounded">{info.getValue()}</div>,
      className: 'break-words break-all',
      flex: 2,
    },
    {
      accessorKey: 'result',
      header: 'Résultat',
      cell: (info) => <div className="font-mono bg-blue-50 px-2 py-1 rounded">{info.getValue()}</div>,
      className: 'break-words break-all',
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
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="small"
            priority="tertiary"
            iconId="fr-icon-edit-line"
            title="Modifier la règle"
            onClick={() => {
              setEditingRule(row.original);
              setEditSearchPattern(row.original.search_pattern);
              setEditResult(row.original.result);
              setEditActive(row.original.active);
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

  const handleCreate = toastErrors(
    async () => {
      if (!newSearchPattern.trim() || !newResult.trim()) return;

      // Validation de l'expression
      const validation = validateExpression(newSearchPattern.trim());
      if (!validation.isValid) {
        throw new Error(`Expression invalide: ${validation.error}`);
      }

      await create({
        search_pattern: newSearchPattern.trim(),
        result: newResult.trim(),
        active: newActive,
      });
      resetCreateDialog();
    },
    (err: any) => (err.code === 'unique_constraint_violation' ? 'Cette règle existe déjà' : err.message)
  );

  const handleEdit = toastErrors(async () => {
    if (!editingRule || !editSearchPattern.trim() || !editResult.trim()) return;

    // Validation de l'expression
    const validation = validateExpression(editSearchPattern.trim());
    if (!validation.isValid) {
      throw new Error(`Expression invalide: ${validation.error}`);
    }

    await updateCrud(editingRule.id, {
      search_pattern: editSearchPattern.trim(),
      result: editResult.trim(),
      active: editActive,
    });
    resetEditDialog();
  });

  const handleDelete = toastErrors(async () => {
    if (!deletingRule) return;
    await deleteCrud(deletingRule.id);
    setDeletingRule(null);
    setIsDeleteDialogOpen(false);
  });

  const resetCreateDialog = () => {
    setNewSearchPattern('');
    setNewResult('');
    setNewActive(true);
    setIsCreateDialogOpen(false);
  };

  const resetEditDialog = () => {
    setEditSearchPattern('');
    setEditResult('');
    setEditActive(true);
    setEditingRule(null);
    setIsEditDialogOpen(false);
  };

  return (
    <SimplePage title="Gestion des règles d'affectation" mode="authenticated">
      <Box py="4w" className="fr-container">
        <div className="flex justify-between items-center mb-4">
          <Heading as="h1" color="blue-france">
            Gestion des règles d'affectation
          </Heading>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Ajouter une règle</Button>
        </div>
        <CallOut title="Règles d'affectation" size="sm">
          <p>
            Les règles d'affectation permettent d'automatiser le calcul du champ <strong>Affecté à</strong> des demandes en fonction des
            tags gestionnaires.
          </p>
          <ul className="mb-0">
            <li>Chaque règle est composée d'un motif de recherche qui est une expression logique et d'un tag résultant.</li>
            <li>
              Les expressions peuvent utiliser les opérateurs <code>&&</code> (ET), <code>||</code> (OU), <code>!</code> (NON) et les
              parenthèses.
            </li>
            <li>
              Les tags peuvent utiliser des caractères joker <code>*</code> pour des correspondances partielles :
              <ul>
                <li>
                  <code>Tag*</code> : correspond à tous les tags commençant par "Tag" (ex: Tag1, Tag2, TagAdmin)
                </li>
                <li>
                  <code>*Tag</code> : correspond à tous les tags finissant par "Tag" (ex: MonTag, VotreTag)
                </li>
                <li>
                  <code>*Tag*</code> : correspond à tous les tags contenant "Tag" (ex: MonTag, TagAdmin, VotreTag)
                </li>
                <li>
                  <code>Tag</code> : correspondance exacte (comportement par défaut)
                </li>
              </ul>
            </li>
            <li>
              Exemple : <code>SIPPEREC && (ENGIE* || Coriance) && !Dalkia* </code> affectera les demandes ayant le tag "SIPPEREC" ET un tag
              commençant par "ENGIE" OU le tag exact "Coriance", ET n'ayant aucun tag commençant par "Dalkia".
            </li>
            <li>
              Le résultat correspond à la valeur qui sera utilisée pour le champ <strong>Affecté à</strong> de la demande si la règle
              s'applique.
            </li>
            <li>
              Le champ <strong>Affecté à</strong> proposera des suggestions de tags en fonction des résultats issues des règles
              d'affectation.
            </li>
          </ul>
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} title="Ajouter une règle" size="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="Motif de recherche"
            nativeInputProps={{
              value: newSearchPattern,
              onChange: (e) => setNewSearchPattern(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleCreate(),
              placeholder: 'Ex: "Tag1" && "Tag2*" || ("Tag3" && !"Tag4*")',
            }}
          />
          <ExpressionValidator expression={newSearchPattern} />
          <ExpressionTester expression={newSearchPattern} />
          <Input
            label="Résultat"
            nativeInputProps={{
              value: newResult,
              onChange: (e) => setNewResult(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleCreate(),
              placeholder: 'Ex: tag_example',
            }}
          />
          <Checkbox
            label="Règle active"
            nativeInputProps={{
              name: 'active',
              checked: newActive,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewActive(e.target.checked),
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title="Modifier la règle" size="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="Motif de recherche"
            nativeInputProps={{
              value: editSearchPattern,
              onChange: (e) => setEditSearchPattern(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleEdit(),
              placeholder: 'Ex: "Tag1" && "Tag2*" || ("Tag3" && !"Tag4*")',
            }}
          />
          <ExpressionValidator expression={editSearchPattern} />
          <ExpressionTester expression={editSearchPattern} />
          <Input
            label="Résultat"
            nativeInputProps={{
              value: editResult,
              onChange: (e) => setEditResult(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleEdit(),
              placeholder: 'Ex: tag_example',
            }}
          />
          <Checkbox
            label="Règle active"
            nativeInputProps={{
              name: 'edit-active',
              checked: editActive,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditActive(e.target.checked),
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Supprimer la règle" size="sm">
        <div className="flex flex-col gap-4">
          <p>Êtes-vous sûr de vouloir supprimer la règle avec le pattern "{deletingRule?.search_pattern}" ?</p>
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
