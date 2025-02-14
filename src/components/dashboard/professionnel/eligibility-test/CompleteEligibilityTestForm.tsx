import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { standardSchemaValidator, useForm } from '@tanstack/react-form';
import { z } from 'zod';

import { getInputErrorStates } from '@/components/form/tanstack-form';
import Button from '@/components/ui/Button';
import { usePost } from '@/hooks/useApi';
import { type ProEligibilityTestFileRequest } from '@/pages/api/pro-eligibility-tests/[id]';
import { toastErrors } from '@/services/notification';

import { allowedExtensions, FormErrorMessage, zAddressesFile } from './shared';

const zCompleteEligibilityTest = z.strictObject({
  file: zAddressesFile,
});

type CompleteEligibilityTest = z.infer<typeof zCompleteEligibilityTest>;

type CompleteEligibilityTestFormProps = {
  onClose: () => void;
  testId: string;
};

const CompleteEligibilityTestForm = ({ onClose, testId }: CompleteEligibilityTestFormProps) => {
  const { mutateAsync: completeTest } = usePost<ProEligibilityTestFileRequest>(`/api/pro-eligibility-tests/${testId}`, {
    invalidate: ['/api/pro-eligibility-tests'],
  });

  const form = useForm({
    defaultValues: {
      file: undefined as unknown as File,
    },
    validatorAdapter: standardSchemaValidator(),
    validators: {
      onChange: zCompleteEligibilityTest,
    },
    onSubmit: toastErrors(async ({ value }: { value: CompleteEligibilityTest }) => {
      await completeTest({
        csvContent: await value.file.text(),
      });
    }, FormErrorMessage),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        <form.Field
          name="file"
          children={(field) => (
            <Upload
              label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
              hint=""
              nativeInputProps={{
                required: true,
                id: field.name,
                name: field.name,
                accept: allowedExtensions.join(','),
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  field.handleChange(file);
                },
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
              <Button priority="secondary" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                Compléter le test
              </Button>
            </div>
          )}
        />
      </div>
    </form>
  );
};

export default CompleteEligibilityTestForm;
