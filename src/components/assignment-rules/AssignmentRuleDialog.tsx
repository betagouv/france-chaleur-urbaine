import { useEffect } from 'react';
import { z } from 'zod';

import ExpressionTester from '@/components/assignment-rules/ExpressionTester';
import ExpressionValidator from '@/components/assignment-rules/ExpressionValidator';
import useForm from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { type AssignmentRule } from '@/server/services/assignment-rules';
import { validateExpression, validateResult } from '@/utils/expression-parser';

const assignmentRuleSchema = z.object({
  search_pattern: z
    .string()
    .min(1, 'Le motif de recherche est obligatoire')
    .superRefine((value, ctx) => {
      const validation = validateExpression(value.trim());
      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.error,
        });
      }
    }),
  result: z
    .string()
    .min(1, 'Le résultat est obligatoire')
    .superRefine((value, ctx) => {
      const validation = validateResult(value.trim());
      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.error,
        });
      }
    }),
  active: z.boolean(),
});

type AssignmentRuleFormData = z.infer<typeof assignmentRuleSchema>;

export type AssignmentRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: AssignmentRule | null;
  onSubmit: (data: AssignmentRuleFormData) => Promise<void>;
};

const AssignmentRuleDialog = ({ open, onOpenChange, rule, onSubmit }: AssignmentRuleDialogProps) => {
  const isEditing = !!rule;
  const title = isEditing ? 'Modifier la règle' : 'Ajouter une règle';

  const { Form, Field, Submit, form } = useForm({
    schema: assignmentRuleSchema,
    defaultValues: {
      search_pattern: rule?.search_pattern ?? '',
      result: rule?.result ?? '',
      active: rule?.active ?? true,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      handleClose();
    },
  });

  // Réinitialiser les valeurs quand la règle change ou quand on ouvre/ferme
  useEffect(() => {
    if (open && rule) {
      form.reset({
        search_pattern: rule.search_pattern,
        result: rule.result,
        active: rule.active,
      });
    } else if (open && !rule) {
      form.reset({
        search_pattern: '',
        result: '',
        active: true,
      });
    }
  }, [open, rule, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} size="lg">
      <Form>
        <div className="flex flex-col gap-4">
          <Field.Input
            name="search_pattern"
            label="Motif de recherche"
            hintText='Ex: tags:"ENGIE*" && commune.insee_dep:"94" || commune.nom:"Paris"'
            nativeInputProps={{
              placeholder: 'Ex: tags:"ENGIE*" && commune.insee_dep:"94"',
            }}
          />

          <form.Subscribe
            selector={(state) => state.values.search_pattern}
            children={(searchPatternValue) => (
              <>
                <ExpressionValidator expression={searchPatternValue} />
                <ExpressionTester
                  expression={searchPatternValue || ''}
                  onPropertySelect={(property) => {
                    form.setFieldValue('search_pattern', `${searchPatternValue} ${property}`);
                  }}
                />
              </>
            )}
          />

          <Field.Input
            name="result"
            label="Résultat"
            hintText='Ex: tag:"MonTag" affecte:"Gestionnaire" (séparer par des espaces pour plusieurs actions)'
            nativeInputProps={{
              placeholder: 'Ex: tag:"MonTag" affecte:"Gestionnaire"',
            }}
          />

          <Field.Checkbox name="active" label="Règle active" />

          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={handleClose}>
              Annuler
            </Button>
            <Submit>{isEditing ? 'Modifier' : 'Créer'}</Submit>
          </div>
        </div>
      </Form>
    </Dialog>
  );
};

export default AssignmentRuleDialog;
