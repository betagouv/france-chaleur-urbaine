import Input from '@codegouvfr/react-dsfr/Input';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

import Upload from '@/components/form/dsfr/Upload';
import { getInputErrorStates } from '@/components/form/react-form/useForm';
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

  const form = useForm({
    defaultValues: {
      name: '',
      file: undefined as unknown as File,
    },
    validators: {
      onChange: zCreateEligibilityTest,
    },
    onSubmit: toastErrors(async ({ value }: { value: CreateEligibilityTest }) => {
      await createTest({
        name: value.name,
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
