import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
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

  const { Form, Submit, Upload } = useForm({
    defaultValues: {
      file: undefined as unknown as File,
    },
    schema: zCompleteEligibilityTest,
    onSubmit: toastErrors(async ({ value }: { value: CompleteEligibilityTest }) => {
      await completeTest({
        csvContent: await parseUnknownCharsetText(await value.file.arrayBuffer()),
      });
      closeModal();
    }, FormErrorMessage),
  });

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <Upload
          name="file"
          label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
          nativeInputProps={{
            accept: allowedExtensions.join(','),
          }}
        />

        <div className="flex justify-end gap-2 mt-4">
          <Button priority="secondary" onClick={closeModal}>
            Annuler
          </Button>
          <Submit>Compléter le test</Submit>
        </div>
      </div>
    </Form>
  );
};

export default CompleteEligibilityTestForm;
