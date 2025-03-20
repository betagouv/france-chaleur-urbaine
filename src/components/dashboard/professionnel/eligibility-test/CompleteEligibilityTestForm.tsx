import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

import Upload from '@/components/form/dsfr/Upload';
import { getInputErrorStates } from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import { usePost } from '@/hooks/useApi';
import { type ProEligibilityTestFileRequest } from '@/pages/api/pro-eligibility-tests/[id]';
import { toastErrors } from '@/services/notification';
import { parseUnknownCharsetText } from '@/utils/strings';

import { allowedExtensions, FormErrorMessage, zAddressesFile } from './shared';

const zCompleteEligibilityTest = z.strictObject({
  file: zAddressesFile,
});

type CompleteEligibilityTest = z.infer<typeof zCompleteEligibilityTest>;

type CompleteEligibilityTestFormProps = {
  testId: string;
};

const CompleteEligibilityTestForm = ({ testId }: CompleteEligibilityTestFormProps) => {
  const { closeModal } = useModal();
  const { mutateAsync: completeTest } = usePost<ProEligibilityTestFileRequest>(`/api/pro-eligibility-tests/${testId}`, {
    invalidate: ['/api/pro-eligibility-tests'],
  });

  const form = useForm({
    defaultValues: {
      file: undefined as unknown as File,
    },
    validators: {
      onChange: zCompleteEligibilityTest,
    },
    onSubmit: toastErrors(async ({ value }: { value: CompleteEligibilityTest }) => {
      await completeTest({
        csvContent: await parseUnknownCharsetText(await value.file.arrayBuffer()),
      });
      closeModal();
    }, FormErrorMessage),
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
              <Button priority="secondary" onClick={closeModal}>
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
