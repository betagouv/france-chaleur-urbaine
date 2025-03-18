import { Input } from '@codegouvfr/react-dsfr/Input';
import { standardSchemaValidator, useForm } from '@tanstack/react-form';

import { getInputErrorStates } from '@/components/form/tanstack-form';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import { usePost } from '@/hooks/useApi';
import { notify, toastErrors } from '@/services/notification';
import { zRenameProEligibilityTestRequest, type RenameProEligibilityTestRequest } from '@/validation/pro-eligibility-test';

type RenameEligibilityTestFormProps = {
  testId: string;
  currentName: string;
};

const RenameEligibilityTestForm = ({ testId, currentName }: RenameEligibilityTestFormProps) => {
  const { closeModal } = useModal();
  const { mutateAsync: renameTest } = usePost<RenameProEligibilityTestRequest>(`/api/pro-eligibility-tests/${testId}/rename`, {
    invalidate: ['/api/pro-eligibility-tests'],
    onSuccess: () => {
      notify('success', 'Le test a été renommé avec succès');
    },
  });

  const form = useForm({
    defaultValues: {
      name: currentName,
    },
    validatorAdapter: standardSchemaValidator(),
    validators: {
      onChange: zRenameProEligibilityTestRequest,
    },
    onSubmit: toastErrors(
      async ({ value }: { value: RenameProEligibilityTestRequest }) => {
        await renameTest({
          name: value.name,
        });
        closeModal();
      },
      (err) => `Une erreur est survenue lors du renommage du test: ${err.message}`
    ),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-4">
        <form.Field
          name="name"
          children={(field) => (
            <Input
              label="Nom du test"
              nativeInputProps={{
                required: true,
                id: field.name,
                name: field.name,
                value: field.state.value,
                onChange: (e) => field.handleChange(e.target.value),
                onBlur: field.handleBlur,
              }}
              {...getInputErrorStates(field)}
            />
          )}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex justify-end gap-2 mt-4">
              <Button priority="secondary" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                Renommer
              </Button>
            </div>
          )}
        />
      </div>
    </form>
  );
};

export default RenameEligibilityTestForm;
