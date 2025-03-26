import { useState } from 'react';
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
  skipFirstLine: z.boolean(),
});

type CompleteEligibilityTest = z.infer<typeof zCompleteEligibilityTest>;

type CompleteEligibilityTestFormProps = {
  testId: string;
};

const CompleteEligibilityTestForm = ({ testId }: CompleteEligibilityTestFormProps) => {
  const { closeModal } = useModal();
  const [previewLines, setPreviewLines] = useState<string[]>([]);

  const { mutateAsync: completeTest } = usePost<ProEligibilityTestFileRequest>(`/api/pro-eligibility-tests/${testId}`, {
    invalidate: ['/api/pro-eligibility-tests'],
  });

  const { Form, Submit, Upload, Checkbox, useValue } = useForm({
    defaultValues: {
      file: undefined as unknown as File,
      skipFirstLine: false,
    },
    schema: zCompleteEligibilityTest,
    onSubmit: toastErrors(async ({ value }: { value: CompleteEligibilityTest }) => {
      const fileContent = await parseUnknownCharsetText(await value.file.arrayBuffer());
      const lines = fileContent.split('\n');
      const csvContent = value.skipFirstLine && lines.length > 1 ? lines.slice(1).join('\n') : fileContent;

      await completeTest({
        csvContent,
      });
      closeModal();
    }, FormErrorMessage),
  });

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      setPreviewLines([]);
      return;
    }

    const content = await parseUnknownCharsetText(await file.arrayBuffer());
    const lines = content
      .split('\n', 3)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setPreviewLines(lines);
  };

  const skipFirstLine = useValue('skipFirstLine');

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <Upload
          name="file"
          label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
          nativeInputProps={{
            accept: allowedExtensions.join(','),
            onChange: (e) => handleFileChange(e.target.files?.[0]),
          }}
        />

        {previewLines.length > 0 && (
          <>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-1">Aperçu des 3 premières lignes :</p>
              <div className="space-y-1">
                {previewLines.map((line, index) => (
                  <div key={index} className="text-sm text-gray-600 font-mono break-all">
                    {index === 0 && skipFirstLine ? <span className="line-through">{line}</span> : line}
                  </div>
                ))}
              </div>
            </div>
            <Checkbox name="skipFirstLine" label="Ignorer la première ligne (en-têtes)" />
          </>
        )}

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
