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
  name: z
    .string({ message: 'Le nom du test est obligatoire' })
    .min(1, { message: 'Le nom du test est obligatoire' })
    .max(100, { message: 'Le nom du test ne doit pas dépasser 100 caractères' }),
});

type CreateEligibilityTest = z.infer<typeof zCreateEligibilityTest>;

const CreateEligibilityTestForm = () => {
  const { closeModal } = useModal();
  const { mutateAsync: createTest } = usePost<ProEligibilityTestCreateInput, ProEligibilityTestCreateOutput>('/api/pro-eligibility-tests', {
    invalidate: ['/api/pro-eligibility-tests'],
  });

  const { Form, Input, Submit, Upload, form } = useForm({
    defaultValues: {
      name: '',
      file: undefined as unknown as File,
    },
    schema: zCreateEligibilityTest,
    onSubmit: toastErrors(async ({ value }: { value: CreateEligibilityTest }) => {
      await createTest({
        name: value.name,
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
            onChange: (e) => {
              const file = e.target.files?.[0];
              if (!file) {
                return;
              }

              // Initialize test name to the filename without extension by default
              if (form.getFieldValue('name') === '') {
                const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
                form.setFieldValue('name', nameWithoutExtension);
              }
              form.validateField('name', 'change');
            },
          }}
        />

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
