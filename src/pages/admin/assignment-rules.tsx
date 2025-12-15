import { useState } from 'react';

import AssignmentRuleDialog from '@/components/assignment-rules/AssignmentRuleDialog';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import useCrud from '@/hooks/useCrud';
import type { AssignmentRule } from '@/modules/demands/server/assignment-rules-service';
import { toastErrors } from '@/modules/notification';
import type { AssignmentRulesResponse } from '@/pages/api/admin/assignment-rules/[[...slug]]';
import { withAuthentication } from '@/server/authentication';
import cx from '@/utils/cx';

const initialSortingState = [{ desc: false, id: 'search_pattern' }];

export default function ManageAssignmentRules() {
  const {
    items: rules,
    isLoading,
    create,
    update: updateCrud,
    delete: deleteCrud,
  } = useCrud<AssignmentRulesResponse>('/api/admin/assignment-rules');

  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<AssignmentRule | null>(null);

  const tableColumns: ColumnDef<AssignmentRule>[] = [
    {
      accessorKey: 'search_pattern',
      cell: (info) => <div className="bg-zinc-50 px-1 py-[0.1rem] rounded-xs font-mono text-sm">{info.getValue()}</div>,
      className: 'break-words',
      flex: 2,
      header: 'Conditions',
    },
    {
      accessorKey: 'result',
      cell: (info) => <div className="font-mono bg-blue-50 px-2 py-1 rounded-sm text-sm">{info.getValue()}</div>,
      className: 'break-words',
      header: 'Actions',
    },
    {
      accessorKey: 'active',
      align: 'center',
      cell: (info) => (
        <span
          className={cx(
            'px-2 py-1 rounded-sm text-xs font-medium',
            info.getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          )}
        >
          {info.getValue() ? 'Actif' : 'Inactif'}
        </span>
      ),
      filterType: 'Facets',
      header: 'Statut',
      width: '100px',
    },
    {
      accessorKey: 'created_at',
      cellType: 'Date',
      header: 'Créé le',
      width: '100px',
    },
    {
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
              setIsRuleDialogOpen(true);
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
      header: 'Actions',
      id: 'actions',
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
          <Button
            onClick={() => {
              setEditingRule(null);
              setIsRuleDialogOpen(true);
            }}
          >
            Ajouter une règle
          </Button>
        </div>

        <CallOut title="Règles dynamiques" size="sm">
          <p>
            Les règles dynamiques permettent d'automatiser l'ajout de tags et l'affectation des demandes selon des critères basés sur les
            données d'éligibilité.
          </p>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Conditions disponibles :</h4>
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-xs [&_code]:font-mono">
                <li>
                  <code>tags:"pattern"</code> : cherche dans les tags gestionnaires
                </li>
                <li>
                  <code>communes:"Paris"</code> : cherche dans les communes du réseau
                </li>
                <li>
                  <code>commune.nom:"Paris"</code> : nom de la commune
                </li>
                <li>
                  <code>commune.insee_dep:"75"</code> : code département de la commune
                </li>
                <li>
                  <code>departement.nom:"Val-de-Marne"</code> : nom du département
                </li>
                <li>
                  <code>region.nom:"Île-de-France"</code> : nom de la région
                </li>
                <li>
                  <code>epci.nom:"Métropole du Grand Paris"</code> : nom de l'EPCI
                </li>
                <li>
                  <code>epci.type:"METRO"</code> : type d'EPCI
                </li>
                <li>
                  <code>ept.nom:"Nom de l'EPT"</code> : nom de l'EPT
                </li>
                <li>
                  <code>type:"dans_pdp"</code> : type d'éligibilité
                </li>
                <li>
                  <code>distance:"&lt;100"</code> : distance au réseau (avec opérateurs &lt;, &gt;, =)
                </li>
                <li>
                  <code>nom:"Réseau*"</code> : nom du réseau
                </li>
                <li>
                  <code>reseauDeChaleur.tags:"Dalkia*"</code> : tags du réseau de chaleur
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Opérateurs logiques :</h4>
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-xs [&_code]:font-mono">
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
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-xs [&_code]:font-mono">
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
              <ul className="mb-0 text-sm space-y-1 [&_code]:bg-zinc-300 [&_code]:px-1 [&_code]:py-[0.1rem] [&_code]:rounded-xs [&_code]:font-mono">
                <li>
                  <code>commune.insee_dep:"94"</code> → <code>tag:"Val-de-Marne"</code>
                </li>
                <li>
                  <code>tags:"ENGIE*" && type:"dans_pdp"</code> → <code>affecte:"ENGIE"</code>
                </li>
                <li>
                  <code>commune.nom:"Paris" || commune.nom:"Lyon"</code> → <code>tag:"Grande_Ville"</code>
                </li>
                <li>
                  <code>region.nom:"Île-de-France" && epci.type:"METRO"</code> → <code>tag:"IDF_METRO"</code>
                </li>
                <li>
                  <code>departement.nom:"Puy-de-Dôme"</code> → <code>tag:"ADUHME" affecte:"ADUHME"</code>
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

      <AssignmentRuleDialog
        open={isRuleDialogOpen}
        onOpenChange={(open) => {
          setIsRuleDialogOpen(open);
          if (!open) {
            setEditingRule(null);
          }
        }}
        rule={editingRule}
        onSubmit={async (ruleData) => {
          if (editingRule) {
            await updateCrud(editingRule.id, ruleData);
          } else {
            await create(ruleData);
          }
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
