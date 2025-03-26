import Input from '@codegouvfr/react-dsfr/Input';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { z } from 'zod';

import Checkbox from '@/components/form/dsfr/Checkbox';
import Upload from '@/components/form/dsfr/Upload';
import { getInputErrorStates } from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import { usePost } from '@/hooks/useApi';
import { type ProEligibilityTestCreateInput, type ProEligibilityTestCreateOutput } from '@/pages/api/pro-eligibility-tests';
import { toastErrors } from '@/services/notification';
import { CSVToArray } from '@/utils/csv';
import { parseUnknownCharsetText } from '@/utils/strings';

import { allowedExtensions, FormErrorMessage, zAddressesFile } from './shared';

const zCreateEligibilityTest = z.strictObject({
  file: zAddressesFile,
  skipFirstLine: z.boolean(),
  name: z
    .string({ message: 'Le nom du test est obligatoire' })
    .min(1, { message: 'Le nom du test est obligatoire' })
    .max(100, { message: 'Le nom du test ne doit pas dépasser 100 caractères' }),
});

type CreateEligibilityTest = z.infer<typeof zCreateEligibilityTest>;

const CreateEligibilityTestForm = () => {
  const { closeModal } = useModal();
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const { mutateAsync: createTest } = usePost<ProEligibilityTestCreateInput, ProEligibilityTestCreateOutput>('/api/pro-eligibility-tests', {
    invalidate: ['/api/pro-eligibility-tests'],
  });

  const form = useForm({
    defaultValues: {
      name: '',
      file: undefined as unknown as File,
      skipFirstLine: false,
    },
    validators: {
      onChange: zCreateEligibilityTest,
    },
    onSubmit: toastErrors(async ({ value }: { value: CreateEligibilityTest }) => {
      const fileContent = await parseUnknownCharsetText(await value.file.arrayBuffer());
      const lines = fileContent.split('\n');
      const csvContent = value.skipFirstLine && lines.length > 1 ? lines.slice(1).join('\n') : fileContent;

      await createTest({
        name: value.name,
        csvContent,
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

                  // Initialize test name to the filename without extension by default
                  if (form.getFieldValue('name') === '') {
                    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
                    form.setFieldValue('name', nameWithoutExtension);
                  }
                  form.validateField('name', 'change');
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
            <form.Field
              name="skipFirstLine"
              children={(field) => (
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

        <form.Field
          name="name"
          children={(field) => (
            <Input
              label="Nom du test"
              hintText="Le nom du test sera utilisé pour identifier le test dans l'historique"
              nativeInputProps={{
                required: true,
                id: field.name,
                name: field.name,
                placeholder: 'Nom du test',
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
                Créer le test
              </Button>
            </div>
          )}
        />
      </div>
    </form>
  );
};

export default CreateEligibilityTestForm;
