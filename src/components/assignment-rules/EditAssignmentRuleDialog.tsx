import { Input } from '@codegouvfr/react-dsfr/Input';
import { useEffect, useState } from 'react';

import ExpressionTester from '@/components/assignment-rules/ExpressionTester';
import ExpressionValidator from '@/components/assignment-rules/ExpressionValidator';
import Checkbox from '@/components/form/dsfr/Checkbox';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { type AssignmentRule } from '@/server/services/assignment-rules';
import { toastErrors } from '@/services/notification';
import { validateExpression, validateResult } from '@/utils/expression-parser';

export type EditAssignmentRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AssignmentRule | null;
  onUpdate: (id: string, data: { search_pattern?: string; result?: string; active?: boolean }) => Promise<void>;
};

const EditAssignmentRuleDialog = ({ open, onOpenChange, rule, onUpdate }: EditAssignmentRuleDialogProps) => {
  const [searchPattern, setSearchPattern] = useState('');
  const [result, setResult] = useState('');
  const [active, setActive] = useState(true);

  // Réinitialiser les valeurs quand la règle change
  useEffect(() => {
    if (rule) {
      setSearchPattern(rule.search_pattern);
      setResult(rule.result);
      setActive(rule.active);
    }
  }, [rule]);

  const resetForm = () => {
    setSearchPattern('');
    setResult('');
    setActive(true);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleUpdate = toastErrors(async () => {
    if (!rule || !searchPattern.trim() || !result.trim()) return;

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

    await onUpdate(rule.id, {
      search_pattern: searchPattern.trim(),
      result: result.trim(),
      active,
    });
    handleClose();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Modifier la règle" size="lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Motif de recherche"
          hintText='Ex: tag:"ENGIE*" && commune.insee_dep:"94" || commune.nom:"Paris"'
          nativeInputProps={{
            value: searchPattern,
            onChange: (e) => setSearchPattern(e.target.value),
            onKeyDown: (e) => e.key === 'Enter' && handleUpdate(),
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
            onKeyDown: (e) => e.key === 'Enter' && handleUpdate(),
            placeholder: 'Ex: tag:"MonTag" affecte:"Gestionnaire"',
          }}
        />

        <Checkbox
          label="Règle active"
          nativeInputProps={{
            name: 'edit-active',
            checked: active,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setActive(e.target.checked),
          }}
        />

        <div className="flex justify-end gap-2">
          <Button priority="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleUpdate}>Modifier</Button>
        </div>
      </div>
    </Dialog>
  );
};

export default EditAssignmentRuleDialog;
