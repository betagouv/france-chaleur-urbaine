import { useState } from 'react';
import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import { usePost } from '@/hooks/useApi';
import { type ProEligibilityTestCreateInput, type ProEligibilityTestCreateOutput } from '@/pages/api/pro-eligibility-tests';
import { toastErrors } from '@/services/notification';
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

  const { Form, Input, Submit, Upload, Checkbox, useValue, form } = useForm({
    defaultValues: {
      name: '',
      file: undefined as unknown as File,
      skipFirstLine: false,
    },
    schema: zCreateEligibilityTest,
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

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      setPreviewLines([]);
      return;
    }

    const content = await parseUnknownCharsetText(await file.arrayBuffer());
    const lines = content.split('\n', 3).map((line) => line.trim());
    setPreviewLines(lines);

    // Initialize test name to the filename without extension by default
    if (form.getFieldValue('name') === '') {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      form.setFieldValue('name', nameWithoutExtension);
    }
    form.validateField('name', 'change');
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
            <Checkbox name="skipFirstLine" label="Ignorer la première ligne (si entête)" />
          </>
        )}

        <Input
          name="name"
          label="Nom du test"
          nativeInputProps={{
            placeholder: 'Nom du test',
          }}
        />

        <div className="flex justify-end gap-2 mt-4">
          <Button priority="secondary" onClick={closeModal}>
            Annuler
          </Button>
          <Submit>Créer le test</Submit>
        </div>
      </div>
    </Form>
  );
};

export default CreateEligibilityTestForm;
