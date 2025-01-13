import Alert from '@codegouvfr/react-dsfr/Alert';
import RadioButtons, { type RadioButtonsProps } from '@codegouvfr/react-dsfr/RadioButtons';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { type FieldApi, type FormState, standardSchemaValidator, useForm } from '@tanstack/react-form';
import { useEffect, useState } from 'react';
import { z, type ZodSchema } from 'zod';

import Input from '@/components/form/dsfr/Input';
import Button from '@/components/ui/Button';
import { toastErrors } from '@/services/notification';
import { postFormDataFetchJSON } from '@/utils/network';
import { formatFileSize } from '@/utils/strings';
import { nonEmptyArray, ObjectKeys } from '@/utils/typescript';

const typesUtilisateur = [
  {
    label: 'une collectivité',
    key: 'Collectivité',
  },
  {
    label: 'un exploitant',
    key: 'Exploitant',
  },
  {
    label: 'autre',
    key: 'Autre',
  },
] as const;

type TypeUtilisateur = (typeof typesUtilisateur)[number]['key'];

const typesDemande = [
  {
    label: 'ajouter le tracé d’un réseau existant',
    key: 'ajout tracé réseau existant',
  },
  {
    label: 'ajouter le tracé d’un réseau en construction (nouveau réseau ou extension)',
    key: 'ajout tracé réseau en construction',
  },
  {
    label: 'ajouter un périmètre de développement prioritaire',
    key: 'ajout périmètre développement prioritaire',
  },
  {
    label: 'ajouter un schéma directeur',
    key: 'ajout schéma directeur',
  },
  {
    label: 'signaler une erreur',
    key: 'signaler une erreur',
  },
  {
    label: 'autre',
    key: 'autre',
  },
] as const;

type TypeDemande = (typeof typesDemande)[number]['key'];

type FieldConfig = {
  name: string;
  label: string;
  optional?: boolean;
  schema: ZodSchema;
  type?: 'string' | 'file';
};

export const filesLimits = {
  maxFiles: 10,
  maxFileSize: 50 * 1024 * 1024,
  maxTotalFileSize: 250 * 1024 * 1024,
};
export const allowedExtensions = ['.shp', '.gpkg', '.geojson', '.dxf', '.gdb', '.tab', '.kmz', '.zip'] as const;
const filesSchema = z
  .array(z.instanceof(File))
  .refine((files) => files.length <= filesLimits.maxFiles, {
    message: `Vous devez choisir au maximum ${filesLimits.maxFiles} fichiers.`,
  })
  .refine((files) => files.every((file) => file.size <= filesLimits.maxFileSize), {
    message: `Chaque fichier doit être inférieur à ${formatFileSize(filesLimits.maxFileSize)}.`,
  })
  .refine((files) => files.reduce((acc, file) => acc + file.size, 0) <= filesLimits.maxTotalFileSize, {
    message: `Le total des fichier doit être inférieur à ${formatFileSize(filesLimits.maxTotalFileSize)}.`,
  })
  .refine((files) => files.every((file) => allowedExtensions.some((extension) => file.name.endsWith(extension))), {
    message: 'Veuillez choisir des fichiers au bon format',
  });

const stringSchema = z.string({ message: 'Ce champ est obligatoire' });

const typeDemandeFields = {
  'ajout tracé réseau existant': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau :',
      schema: stringSchema,
    },
    {
      name: 'localisation',
      label: 'Localisation :',
      schema: stringSchema,
    },
    {
      name: 'gestionnaire',
      label: 'Gestionnaire :',
      schema: stringSchema,
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
      schema: filesSchema,
    },
    {
      name: 'emailReferentCommercial',
      label: 'Email du référent commercial à qui transmettre les demandes de raccordement',
      optional: true,
      schema: z.string().email().optional(),
    },
    {
      name: 'commentaire',
      label: 'Commentaire :',
      optional: true,
      schema: z.string().optional(),
    },
  ],
  'ajout tracé réseau en construction': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau :',
      schema: stringSchema,
    },
    {
      name: 'localisation',
      label: 'Localisation :',
      schema: stringSchema,
    },
    {
      name: 'gestionnaire',
      label: 'Gestionnaire :',
      schema: stringSchema,
    },
    {
      name: 'dateMiseEnServicePrevisionnelle',
      label: 'Date de mise en service prévisionnelle :',
      schema: stringSchema,
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
      schema: filesSchema,
    },
    {
      name: 'emailReferentCommercial',
      label: 'Email du référent commercial à qui transmettre les demandes de raccordement',
      optional: true,
      schema: z.string().optional(),
    },
    {
      name: 'commentaire',
      label: 'Commentaire :',
      optional: true,
      schema: z.string().optional(),
    },
  ],
  'ajout périmètre développement prioritaire': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau :',
      schema: stringSchema,
    },
    {
      name: 'localisation',
      label: 'Localisation :',
      schema: stringSchema,
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
      schema: filesSchema,
    },
  ],
  'ajout schéma directeur': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau ou du territoire concerné :',
      schema: stringSchema,
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
      schema: filesSchema,
    },
  ],
  'signaler une erreur': [
    {
      name: 'precisions',
      label: 'Précisez :',
      schema: stringSchema,
    },
  ],
  autre: [
    {
      name: 'precisions',
      label: 'Précisez :',
      schema: stringSchema,
    },
  ],
} as const satisfies Record<TypeDemande, FieldConfig[]>;

export const zCommonFormData = z.object({
  typeUtilisateur: z.enum(nonEmptyArray(typesUtilisateur.map((w) => w.key)), { message: 'Ce choix est obligatoire' }),
  typeUtilisateurAutre: stringSchema,
  email: z.string().email("L'adresse email n'est pas valide"),
  dansCadreDemandeADEME: z.boolean({ message: 'Ce choix est obligatoire' }),
});

const zodSchemasByTypeDemande = ObjectKeys(typeDemandeFields).reduce(
  (acc, key) => ({
    ...acc,
    [key]: typeDemandeFields[key].reduce(
      (acc2, field) => ({
        ...acc2,
        [field.name]: (field as FieldConfig).schema,
      }),
      {}
    ),
  }),
  {} as {
    [TypeDemande in keyof typeof typeDemandeFields]: {
      [Name in (typeof typeDemandeFields)[TypeDemande][number]['name']]: Extract<
        (typeof typeDemandeFields)[TypeDemande][number],
        { name: Name }
      >['schema'];
    };
  }
);

export const zContributionFormData = z.discriminatedUnion(
  'typeDemande',
  // définition statique plutôt qu'avec un map sinon on perd le typage
  [
    zCommonFormData.merge(
      z.object({
        typeDemande: z.literal('ajout tracé réseau existant'),
        ...zodSchemasByTypeDemande['ajout tracé réseau existant'],
      })
    ),
    zCommonFormData.merge(
      z.object({
        typeDemande: z.literal('ajout tracé réseau en construction'),
        ...zodSchemasByTypeDemande['ajout tracé réseau en construction'],
      })
    ),
    zCommonFormData.merge(
      z.object({
        typeDemande: z.literal('ajout périmètre développement prioritaire'),
        ...zodSchemasByTypeDemande['ajout périmètre développement prioritaire'],
      })
    ),
    zCommonFormData.merge(
      z.object({
        typeDemande: z.literal('ajout schéma directeur'),
        ...zodSchemasByTypeDemande['ajout schéma directeur'],
      })
    ),
    zCommonFormData.merge(
      z.object({
        typeDemande: z.literal('signaler une erreur'),
        ...zodSchemasByTypeDemande['signaler une erreur'],
      })
    ),
    zCommonFormData.merge(
      z.object({
        typeDemande: z.literal('autre'),
        ...zodSchemasByTypeDemande['autre'],
      })
    ),
  ]
);

type AddEmptyValues<T> = T extends string ? T | '' : T extends object ? { [K in keyof T]: AddEmptyValues<T[K]> } : T;

// besoin de valeurs vides juste pour le formulaire et non zod
type FormData = AddEmptyValues<z.infer<typeof zContributionFormData>>;

const ContributionForm = () => {
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  const form = useForm({
    defaultValues: {
      typeUtilisateur: '',
      typeUtilisateurAutre: '',
      email: '',
      typeDemande: '',
      dansCadreDemandeADEME: '',
    } satisfies Record<keyof FormData, ''> as unknown as FormData,
    validatorAdapter: standardSchemaValidator(),
    validators: {
      onChange: zContributionFormData,
    },
    onSubmit: toastErrors(
      async ({ value }: { value: FormData }) => {
        await postFormDataFetchJSON('/api/contribution', zContributionFormData.parse(value));
        setFormSuccess(true);
      },
      () => (
        <span>
          Une erreur est survenue. Veuillez réessayer plus tard, si le problème persiste contactez-nous directement à l'adresse:{' '}
          <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">france-chaleur-urbaine@developpement-durable.gouv.fr</a>
        </span>
      )
    ),
  });

  // ensure the state is invalid when loaded
  useEffect(() => {
    form.validate('submit');
  }, []);

  return formSuccess ? (
    <Alert severity="success" title="Nous vous remercions pour votre contribution." />
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="typeUtilisateur"
        listeners={{
          onChange: ({ value }) => {
            if (value !== 'Autre') {
              form.setFieldValue('typeUtilisateurAutre', '');
            }
          },
        }}
        children={(field) => (
          <RadioButtons
            legend="Vous êtes :"
            name={field.name}
            options={typesUtilisateur.map((option) => ({
              label: option.label,
              nativeInputProps: {
                required: true,
                checked: field.state.value === option.key,
                value: option.key,
                onChange: (e) => field.handleChange(e.target.value as TypeUtilisateur),
                onBlur: field.handleBlur,
              },
            }))}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Subscribe
        selector={(state: FormState<FormData>) => state.values.typeUtilisateur}
        children={(typeUtilisateur) =>
          typeUtilisateur === 'Autre' && (
            <form.Field
              name="typeUtilisateurAutre"
              children={(field) => (
                <Input
                  label="Précisez :"
                  nativeInputProps={{
                    required: true,
                    id: field.name,
                    name: field.name,
                    value: field.state.value,
                    onChange: (e) => field.handleChange(e.target.value),
                    onBlur: field.handleBlur,
                  }}
                  {...getInputErrorStates(field)}
                />
              )}
            />
          )
        }
      />

      <form.Field
        name="email"
        children={(field) => (
          <Input
            label="Votre adresse email :"
            nativeInputProps={{
              required: true,
              id: field.name,
              name: field.name,
              placeholder: 'Saisir votre email',
              autoComplete: 'email',
              value: field.state.value,
              onChange: (e) => field.handleChange(e.target.value),
              onBlur: field.handleBlur,
            }}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Field
        name="dansCadreDemandeADEME"
        children={(field) => (
          <RadioButtons
            legend="Votre contribution s’inscrit dans le cadre d’une demande de subvention ADEME :"
            name={field.name}
            options={[
              {
                label: 'oui',
                nativeInputProps: {
                  checked: field.state.value,
                  onChange: () => field.handleChange(true),
                  onBlur: field.handleBlur,
                },
              },
              {
                label: 'non',
                nativeInputProps: {
                  checked: !field.state.value,
                  onChange: () => field.handleChange(false),
                  onBlur: field.handleBlur,
                },
              },
            ]}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Field
        name="typeDemande"
        listeners={{
          onChange: ({ value }) => {
            if (value === '') {
              return;
            }
            // when changing typeDemande, the form remembers its old fields so we must remove them manually
            const fieldsToDelete = new Set(ObjectKeys(form.state.fieldMeta))
              .difference(new Set([...ObjectKeys(zCommonFormData.shape), zContributionFormData.discriminator]))
              .difference(new Set(typeDemandeFields[value].map((f) => f.name)));
            fieldsToDelete.forEach((field) => {
              form.deleteField(field);
            });
          },
        }}
        children={(field) => (
          <RadioButtons
            legend="Vous souhaitez :"
            name={field.name}
            options={typesDemande.map((option) => ({
              label: option.label,
              nativeInputProps: {
                required: true,
                checked: field.state.value === option.key,
                value: option.key,
                onChange: (e) => field.handleChange(e.target.value as TypeDemande),
                onBlur: field.handleBlur,
              },
            }))}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Subscribe
        selector={(state: FormState<FormData>) => state.values.typeDemande}
        children={(typeDemande) =>
          typeDemande !== '' &&
          typeDemandeFields[typeDemande].map((option) => (
            <form.Field
              name={option.name}
              key={option.name}
              children={(field) =>
                (option as FieldConfig).type === 'file' ? (
                  <Upload
                    className="fr-mb-2w"
                    label={option.label}
                    hint={`Taille maximale : ${formatFileSize(filesLimits.maxFileSize)}. Formats supportés : ${allowedExtensions.join(
                      ', '
                    )}. Maximum ${filesLimits.maxFiles} fichiers.`}
                    multiple
                    nativeInputProps={{
                      accept: allowedExtensions.join(','),
                      onChange: (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) {
                          return;
                        }
                        field.handleChange([...files]);
                      },
                      onBlur: field.handleBlur,
                    }}
                    {...getInputErrorStates(field)}
                  />
                ) : (
                  <Input
                    label={option.label}
                    nativeInputProps={{
                      required: !(option as FieldConfig).optional,
                      id: field.name,
                      name: field.name,
                      value: field.state.value as string,
                      onChange: (e) => field.handleChange(e.target.value),
                      onBlur: field.handleBlur,
                    }}
                    {...getInputErrorStates(field)}
                  />
                )
              }
            />
          ))
        }
      />

      <form.Subscribe
        selector={(state) => [state.isValid, state.canSubmit, state.isSubmitting]}
        children={([isValid, canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!isValid || !canSubmit || isSubmitting}>
            Envoyer
          </Button>
        )}
      />
    </form>
  );
};

export default ContributionForm;

function getInputErrorStates(field: FieldApi<any, any, any, any, any>): Pick<RadioButtonsProps, 'state' | 'stateRelatedMessage'> {
  return {
    state: field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default',
    stateRelatedMessage: field.state.meta.isTouched && field.state.meta.errors.length ? field.state.meta.errors.join(', ') : undefined,
  };
}
