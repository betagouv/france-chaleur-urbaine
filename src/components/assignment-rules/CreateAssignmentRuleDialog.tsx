import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';

import ExpressionTester from '@/components/assignment-rules/ExpressionTester';
import ExpressionValidator from '@/components/assignment-rules/ExpressionValidator';
import Checkbox from '@/components/form/dsfr/Checkbox';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { toastErrors } from '@/services/notification';
import { validateExpression, validateResult } from '@/utils/expression-parser';

export type CreateAssignmentRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { search_pattern: string; result: string; active: boolean }) => Promise<void>;
};

const CreateAssignmentRuleDialog = ({ open, onOpenChange, onCreate }: CreateAssignmentRuleDialogProps) => {
  const [searchPattern, setSearchPattern] = useState('');
  const [result, setResult] = useState('');
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setSearchPattern('');
    setResult('');
    setActive(true);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreate = toastErrors(
    async () => {
      if (!searchPattern.trim() || !result.trim()) return;

      // Validation de l'expression
      const expressionValidation = validateExpression(searchPattern.trim());
      if (!expressionValidation.isValid) {
        throw new Error(`Expression invalide: ${expressionValidation.error}`);
      }

      // Validation du résultat
      const resultValidation = validateResult(result.trim());
      if (!resultValidation.isValid) {
        throw new Error(`Format de résultat invalide: ${resultValidation.error}`);
      }

      await onCreate({
        search_pattern: searchPattern.trim(),
        result: result.trim(),
        active,
      });
      handleClose();
    },
    (err: any) => (err.code === 'unique_constraint_violation' ? 'Cette règle existe déjà' : err.message)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Ajouter une règle" size="lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Motif de recherche"
          hintText='Ex: tag:"ENGIE*" && commune.insee_dep:"94" || commune.nom:"Paris"'
          nativeInputProps={{
            value: searchPattern,
            onChange: (e) => setSearchPattern(e.target.value),
            onKeyDown: (e) => e.key === 'Enter' && handleCreate(),
            placeholder: 'Ex: tag:"ENGIE*" && commune.insee_dep:"94"',
          }}
        />
        <ExpressionValidator expression={searchPattern} />
        <ExpressionTester expression={searchPattern} />

        <Input
          label="Résultat"
          hintText='Ex: tag:"MonTag" affecte:"Gestionnaire" (séparer par des espaces pour plusieurs actions)'
          nativeInputProps={{
            value: result,
            onChange: (e) => setResult(e.target.value),
            onKeyDown: (e) => e.key === 'Enter' && handleCreate(),
            placeholder: 'Ex: tag:"MonTag" affecte:"Gestionnaire"',
          }}
        />

        <Checkbox
          label="Règle active"
          nativeInputProps={{
            name: 'active',
            checked: active,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setActive(e.target.checked),
          }}
        />

        <div className="flex justify-end gap-2">
          <Button priority="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleCreate}>Créer</Button>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateAssignmentRuleDialog;
