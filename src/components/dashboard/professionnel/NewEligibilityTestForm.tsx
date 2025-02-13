import Input from '@codegouvfr/react-dsfr/Input';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { standardSchemaValidator, useForm } from '@tanstack/react-form';
import { z } from 'zod';

import { getInputErrorStates } from '@/components/form/tanstack-form';
import Button from '@/components/ui/Button';
import { usePost } from '@/hooks/useApi';
import { type ProEligibilityTestCreateInput, type ProEligibilityTestCreateOutput } from '@/pages/api/pro-eligibility-tests';
import { toastErrors } from '@/services/notification';
import { formatFileSize } from '@/utils/strings';

export const filesLimits = {
  maxFileSize: 50 * 1024 * 1024,
};

const allowedExtensions = ['.csv', '.txt'] as const;

export const zCreateEligibilityTestRequest = z.strictObject({
  name: z
    .string({ message: 'Le nom du test est obligatoire' })
    .min(1, { message: 'Le nom du test est obligatoire' })
    .max(100, { message: 'Le nom du test ne doit pas dépasser 100 caractères' }),
  file: z
    .instanceof(File, { message: 'Veuillez choisir un fichier' })
    .refine((file) => file.size <= filesLimits.maxFileSize, {
      message: `La taille du fichier doit être inférieure à ${formatFileSize(filesLimits.maxFileSize)}.`,
    })
    .refine((file) => allowedExtensions.some((extension) => file.name.endsWith(extension)), {
      message: `Le format du fichier n'est pas supporté (attendu : ${allowedExtensions.join(', ')})`,
    }),
});
type CreateEligibilityTestRequest = z.infer<typeof zCreateEligibilityTestRequest>;
type NewEligibilityTestFormProps = {
  onClose: () => void;
};
const NewEligibilityTestForm = ({ onClose }: NewEligibilityTestFormProps) => {
  const { mutateAsync: createTest } = usePost<ProEligibilityTestCreateInput, ProEligibilityTestCreateOutput>('/api/pro-eligibility-tests', {
    invalidate: ['/api/pro-eligibility-tests'],
  });

  const form = useForm({
    defaultValues: {
      name: '',
      file: null as unknown as File,
    },
    validatorAdapter: standardSchemaValidator(),
    validators: {
      onChange: zCreateEligibilityTestRequest,
    },
    onSubmit: toastErrors(
      async ({ value }: { value: CreateEligibilityTestRequest }) => {
        await createTest({
          name: value.name,
          csvContent: await value.file.text(),
        });
      },
      () => (
        <span>
          Une erreur est survenue. Veuillez réessayer plus tard, si le problème persiste contactez-nous directement à l'adresse:{' '}
          <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">france-chaleur-urbaine@developpement-durable.gouv.fr</a>
        </span>
      )
    ),
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
                  const files = e.target.files;
                  if (!files || files.length === 0) {
                    return;
                  }
                  const file = files[0];
                  field.handleChange(file);

                  // Initialize test name to the filename without extension by default
                  if (form.getFieldValue('name') === '') {
                    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
                    form.setFieldValue('name', nameWithoutExtension);
                  }
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
              state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
              stateRelatedMessage={field.state.meta.errors.join(', ')}
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
                Créer le test
              </Button>
            </div>
          )}
        />
      </div>
    </form>
  );
};

export default NewEligibilityTestForm;
