import { useState } from 'react';
import { z } from 'zod';

import Checkbox from '@/components/form/dsfr/Checkbox';
import Upload from '@/components/form/dsfr/Upload';
import useForm, { getInputErrorStates } from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import { usePost } from '@/hooks/useApi';
import { type ProEligibilityTestFileRequest } from '@/pages/api/pro-eligibility-tests/[id]';
import { toastErrors } from '@/services/notification';
import { CSVToArray } from '@/utils/csv';
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

  const { form, Form } = useForm({
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

  const FormFieldNoInfinite = form.Field as any; // ts-expect-error TS2589: Type instantiation is excessively deep and probably infinite

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <FormFieldNoInfinite
          name="file"
          children={(field: any) => (
            <Upload
              label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
              hint="Si le fichier est un .csv, les colonnes seront regroupées pour déduire l'adresse."
              nativeInputProps={{
                required: true,
                id: field.name,
                name: field.name,
                accept: allowedExtensions.join(','),
                onChange: async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setPreviewLines([]);
                    return;
                  }
                  field.handleChange(file);

                  // preview the first 3 lines and pretty separators if csv
                  const isCSVFile = file.name.toLowerCase().endsWith('csv');
                  const content = await parseUnknownCharsetText(await file.arrayBuffer());
                  const lines = content.split('\n', 3).map((line) => line.trim());
                  const csvSeparator = lines.every((line) => line.includes(';')) ? ';' : ',';
                  setPreviewLines(isCSVFile ? CSVToArray(lines.join('\n'), csvSeparator).map((x) => x.join(', ')) : lines);
                },
                onBlur: field.handleBlur,
              }}
              {...getInputErrorStates(field)}
            />
          )}
        />

        {previewLines.length > 0 && (
          <>
            <form.Subscribe
              selector={(state) => [state.values.skipFirstLine]}
              children={([skipFirstLine]) => (
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
              )}
            />
            <FormFieldNoInfinite
              name="skipFirstLine"
              children={(field: any) => (
                <Checkbox
                  small
                  label="Ignorer la première ligne (si entête)"
                  nativeInputProps={{
                    name: field.name,
                    onChange: (e) => field.handleChange(e.target.checked as any),
                    checked: field.state.value as any,
                  }}
                  {...getInputErrorStates(field)}
                />
              )}
            />
          </>
        )}

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
    </Form>
  );
};

export default CompleteEligibilityTestForm;
