import Alert from '@codegouvfr/react-dsfr/Alert';
import { useForm } from '@tanstack/react-form';
import { useEffect, useState } from 'react';
import { type ZodSchema, z } from 'zod';

import { clientConfig } from '@/client-config';
import Input from '@/components/form/dsfr/Input';
import Radio from '@/components/form/dsfr/Radio';
import Upload from '@/components/form/dsfr/Upload';
import { getInputErrorStates } from '@/components/form/react-form/useForm';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { toastErrors } from '@/modules/notification';
import { postFormDataFetchJSON } from '@/utils/network';
import { formatFileSize } from '@/utils/strings';
import { nonEmptyArray, ObjectKeys } from '@/utils/typescript';

const typesUtilisateur = [
  {
    key: 'Collectivité',
    label: 'une collectivité',
  },
  {
    key: 'Exploitant',
    label: 'un exploitant',
  },
  {
    key: 'Autre',
    label: 'autre',
  },
] as const;

type TypeUtilisateur = (typeof typesUtilisateur)[number]['key'];

const typesDemande = [
  {
    key: 'ajout tracé réseau existant',
    label: 'ajouter le tracé d’un réseau existant',
  },
  {
    key: 'ajout tracé réseau en construction',
    label: 'ajouter le tracé d’un réseau en construction (nouveau réseau ou extension)',
  },
  {
    key: 'ajout périmètre développement prioritaire',
    label: 'ajouter un périmètre de développement prioritaire',
  },
  {
    key: 'ajout schéma directeur',
    label: 'ajouter un schéma directeur',
  },
  {
    key: 'autre',
    label: 'autre',
  },
] as const;

type TypeDemande = (typeof typesDemande)[number]['key'];

type FieldConfig = {
  name: string;
  label: string;
  optional?: boolean;
  schema: ZodSchema;
} & (
  | {
      type?: 'string';
    }
  | {
      type: 'file';
      hint: string;
    }
);

export const filesLimits = {
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 10,
  maxTotalFileSize: 250 * 1024 * 1024,
};

// we don't have an approved list of extensions so we remove risky ones
export const riskyExtensions = [
  // Executables
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.bin',
  '.com',
  // Scripts
  '.js',
  '.mjs',
  '.vbs',
  '.wsf',
  '.ps1',
  '.py',
  '.rb',
  '.php',
  '.pl',
  // Documents with macros
  '.docm',
  '.xlsm',
  '.pptm',
  // HTML/Flash
  '.html',
  '.htm',
  '.mht',
  '.xhtml',
  '.swf',
  // Other
  '.jar',
  '.dll',
  '.sys',
  '.scr',
  '.reg',
  '.hta',
  '.cpl',
];

const filesSchema = z
  .array(z.instanceof(File), { error: 'Veuillez choisir un ou plusieurs fichiers' })
  .refine((files) => files.length <= filesLimits.maxFiles, {
    error: `Vous devez choisir au maximum ${filesLimits.maxFiles} fichiers.`,
  })
  .refine((files) => files.every((file) => file.size <= filesLimits.maxFileSize), {
    error: `Chaque fichier doit être inférieur à ${formatFileSize(filesLimits.maxFileSize)}.`,
  })
  .refine((files) => files.reduce((acc, file) => acc + file.size, 0) <= filesLimits.maxTotalFileSize, {
    error: `Le total des fichier doit être inférieur à ${formatFileSize(filesLimits.maxTotalFileSize)}.`,
  })
  .superRefine((files, ctx) => {
    for (const file of files) {
      if (riskyExtensions.some((extension) => file.name.endsWith(extension))) {
        ctx.addIssue({
          code: 'custom',
          fatal: true,
          message: `L'extension du fichier "${file.name}" n'est pas autorisée.`,
        });
        return z.NEVER;
      }
    }
  });

const stringSchema = z.string({ error: 'Ce champ est obligatoire' });

const typeDemandeFields = {
  'ajout périmètre développement prioritaire': [
    {
      label: 'Nom du réseau :',
      name: 'nomReseau',
      schema: stringSchema,
    },
    {
      label: 'Localisation :',
      name: 'localisation',
      schema: stringSchema,
    },
    {
      hint: 'Formats préférentiels : GeoJSON, Shapefile, KML, GeoPackage.',
      label: 'Téléverser vos fichiers :',
      name: 'fichiers',
      schema: filesSchema,
      type: 'file',
    },
  ],
  'ajout schéma directeur': [
    {
      label: 'Nom du réseau ou du territoire concerné :',
      name: 'nomReseau',
      schema: stringSchema,
    },
    {
      hint: 'Formats préférentiels : PDF, Word.',
      label: 'Téléverser vos fichiers :',
      name: 'fichiers',
      schema: filesSchema,
      type: 'file',
    },
  ],
  'ajout tracé réseau en construction': [
    {
      label: 'Nom du réseau :',
      name: 'nomReseau',
      schema: stringSchema,
    },
    {
      label: 'Localisation :',
      name: 'localisation',
      schema: stringSchema,
    },
    {
      label: 'Gestionnaire :',
      name: 'gestionnaire',
      schema: stringSchema,
    },
    {
      label: 'Date de mise en service prévisionnelle :',
      name: 'dateMiseEnServicePrevisionnelle',
      schema: stringSchema,
    },
    {
      label: 'Email du référent commercial à qui transmettre les demandes de raccordement',
      name: 'emailReferentCommercial',
      optional: true,
      schema: z.string().optional(),
    },
    {
      label: 'Commentaire :',
      name: 'commentaire',
      optional: true,
      schema: z.string().optional(),
    },
    {
      hint: 'Formats préférentiels : GeoJSON, Shapefile, KML, GeoPackage.',
      label: 'Téléverser vos fichiers :',
      name: 'fichiers',
      schema: filesSchema,
      type: 'file',
    },
  ],
  'ajout tracé réseau existant': [
    {
      label: 'Nom du réseau :',
      name: 'nomReseau',
      schema: stringSchema,
    },
    {
      label: 'Localisation :',
      name: 'localisation',
      schema: stringSchema,
    },
    {
      label: 'Gestionnaire :',
      name: 'gestionnaire',
      schema: stringSchema,
    },
    {
      label: 'Email du référent commercial à qui transmettre les demandes de raccordement',
      name: 'emailReferentCommercial',
      optional: true,
      schema: z.string().optional(),
    },
    {
      label: 'Commentaire :',
      name: 'commentaire',
      optional: true,
      schema: z.string().optional(),
    },
    {
      hint: 'Formats préférentiels : GeoJSON, Shapefile (shp, shx, prj, cpg, dbf à fournir), KML, GeoPackage.',
      label: 'Téléverser vos fichiers :',
      name: 'fichiers',
      schema: filesSchema,
      type: 'file',
    },
  ],
  autre: [
    {
      label: 'Précisez :',
      name: 'precisions',
      schema: stringSchema,
    },
  ],
} as const satisfies Record<TypeDemande, FieldConfig[]>;

export const zCommonFormData = z.object({
  dansCadreDemandeADEME: z.boolean({ error: 'Ce choix est obligatoire' }),
  email: z.email("L'adresse email n'est pas valide"),
  nom: z.string({ error: 'Ce champ est obligatoire' }),
  prenom: z.string({ error: 'Ce champ est obligatoire' }),
  typeUtilisateur: z.enum(nonEmptyArray(typesUtilisateur.map((w) => w.key)), { error: 'Ce choix est obligatoire' }),
  typeUtilisateurAutre: stringSchema,
});

const zodSchemasByTypeDemande = ObjectKeys(typeDemandeFields).reduce(
  (acc, key) => {
    (acc[key] as any) = typeDemandeFields[key].reduce(
      (acc2, field) => {
        acc2[field.name] = (field as FieldConfig).schema;
        return acc2;
      },
      {} as Record<string, any>
    );
    return acc;
  },
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
        typeDemande: z.literal('autre'),
        ...zodSchemasByTypeDemande.autre,
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
      dansCadreDemandeADEME: '',
      email: '',
      nom: '',
      prenom: '',
      typeDemande: '',
      typeUtilisateur: '',
      typeUtilisateurAutre: '',
    } satisfies Record<keyof FormData, ''> as unknown as FormData,
    onSubmit: toastErrors(
      async ({ value }: { value: FormData }) => {
        await postFormDataFetchJSON('/api/contribution', zContributionFormData.parse(value));
        setFormSuccess(true);
      },
      () => (
        <span>
          Une erreur est survenue. Veuillez réessayer plus tard, si le problème persiste contactez-nous directement à l'adresse:{' '}
          <a href={`mailto:${clientConfig.contactEmail}`}>{clientConfig.contactEmail}</a>
        </span>
      )
    ),
    validators: {
      onChange: zContributionFormData,
    },
  });

  // ensure the state is invalid when loaded
  useEffect(() => {
    void (form.validate as any)('submit');
  }, []);

  return formSuccess ? (
    <Alert
      severity="success"
      title="Nous vous remercions pour votre contribution."
      description={
        <>
          Son intégration sur la carte sera réalisée sous quelques semaines.{' '}
          {form.state.values.dansCadreDemandeADEME
            ? "L'attestation pour votre dossier de demande de subvention ADEME vous sera transmise sous quelques jours."
            : 'Nous vous tiendrons au courant.'}
        </>
      }
    />
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="typeUtilisateur"
        listeners={
          {
            onChange: ({ value }: { value: TypeUtilisateur }) => {
              if (value !== 'Autre') {
                form.setFieldValue('typeUtilisateurAutre', '');
              }
            },
          } as any
        }
        children={(field) => (
          <Radio
            label="Vous êtes :"
            name={field.name}
            options={typesUtilisateur.map((option) => ({
              label: option.label,
              nativeInputProps: {
                checked: field.state.value === option.key,
                onBlur: field.handleBlur,
                onChange: (e) => field.handleChange(e.target.value as TypeUtilisateur),
                required: true,
                value: option.key,
              },
            }))}
            {...getInputErrorStates(field)}
          />
        )}
      />
      <form.Subscribe
        selector={(state) => state.values.typeUtilisateur}
        children={(typeUtilisateur) =>
          typeUtilisateur === 'Autre' && (
            <form.Field
              name="typeUtilisateurAutre"
              children={(field) => (
                <Input
                  label="Précisez :"
                  nativeInputProps={{
                    id: field.name,
                    name: field.name,
                    onBlur: field.handleBlur,
                    onChange: (e) => field.handleChange(e.target.value),
                    required: true,
                    value: field.state.value,
                  }}
                  {...getInputErrorStates(field)}
                />
              )}
            />
          )
        }
      />

      <form.Field
        name="nom"
        children={(field) => (
          <Input
            label="Votre nom :"
            nativeInputProps={{
              autoComplete: 'nom',
              id: field.name,
              name: field.name,
              onBlur: field.handleBlur,
              onChange: (e) => field.handleChange(e.target.value),
              placeholder: 'Saisir votre nom',
              required: true,
              value: field.state.value,
            }}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Field
        name="prenom"
        children={(field) => (
          <Input
            label="Votre prénom :"
            nativeInputProps={{
              autoComplete: 'prenom',
              id: field.name,
              name: field.name,
              onBlur: field.handleBlur,
              onChange: (e) => field.handleChange(e.target.value),
              placeholder: 'Saisir votre prénom',
              required: true,
              value: field.state.value,
            }}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Field
        name="email"
        children={(field) => (
          <Input
            label="Votre adresse email :"
            nativeInputProps={{
              autoComplete: 'email',
              id: field.name,
              name: field.name,
              onBlur: field.handleBlur,
              onChange: (e) => field.handleChange(e.target.value),
              placeholder: 'Saisir votre email',
              required: true,
              value: field.state.value,
            }}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Field
        name="dansCadreDemandeADEME"
        children={(field) => (
          <>
            <Radio
              label="Votre contribution s’inscrit dans le cadre d’une demande de subvention ADEME :"
              name={field.name}
              options={[
                {
                  label: 'oui',
                  nativeInputProps: {
                    checked: field.state.value === true,
                    onBlur: field.handleBlur,
                    onChange: () => field.handleChange(true),
                  },
                },
                {
                  label: 'non',
                  nativeInputProps: {
                    checked: field.state.value === false,
                    onBlur: field.handleBlur,
                    onChange: () => field.handleChange(false),
                  },
                },
              ]}
              {...getInputErrorStates(field)}
            />
            {field.state.value && (
              <Alert
                description="L'attestation vous sera envoyée par mail sous quelques jours, après vérification des fichiers transmis."
                severity="info"
                className="fr-mt-n2w fr-mb-3w"
                small
              />
            )}
          </>
        )}
      />

      <form.Field
        name="typeDemande"
        listeners={
          {
            onChange: ({ value }: { value: TypeDemande | '' }) => {
              if (value === '') {
                return;
              }
              // when changing typeDemande, the form remembers its old fields so we must remove them manually
              const fieldsToDelete = new Set(ObjectKeys(form.state.fieldMeta))
                .difference(new Set([...ObjectKeys(zCommonFormData.shape), 'typeDemande']))
                .difference(new Set(typeDemandeFields[value].map((f) => f.name)));
              fieldsToDelete.forEach((field) => {
                form.deleteField(field);
              });
            },
          } as any
        }
        children={(field) => (
          <Radio
            label="Vous souhaitez :"
            name={field.name}
            options={typesDemande.map((option) => ({
              label: option.label,
              nativeInputProps: {
                checked: field.state.value === option.key,
                onBlur: field.handleBlur,
                onChange: (e) => field.handleChange(e.target.value as TypeDemande),
                required: true,
                value: option.key,
              },
            }))}
            {...getInputErrorStates(field)}
          />
        )}
      />

      <form.Subscribe
        selector={(state) => state.values.typeDemande}
        children={(typeDemande) =>
          typeDemande !== '' &&
          typeDemandeFields[typeDemande].map((option) => (
            <form.Field
              name={option.name}
              key={option.name}
              children={(field: any) =>
                'type' in option && (option as FieldConfig).type === 'file' ? (
                  <>
                    <Upload
                      className="fr-mb-2w"
                      label={option.label}
                      hint={
                        (
                          <>
                            Taille maximale : {formatFileSize(filesLimits.maxFileSize)}. Maximum {filesLimits.maxFiles} fichiers.{' '}
                            {option.hint}
                            <br />
                            Pour téléverser plusieurs fichiers, merci de les sélectionner simultanément et non l'un après l'autre.
                          </>
                        ) as any // dsfr only allow strings
                      }
                      multiple
                      nativeInputProps={{
                        onBlur: field.handleBlur,
                        onChange: (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) {
                            return;
                          }
                          field.handleChange([...files]);
                        },
                      }}
                      {...getInputErrorStates(field)}
                    />
                    {((field.state.value as File[]) ?? []).length > 0 && (
                      <Box mb="2w">
                        Fichier(s) sélectionné(s) :{' '}
                        {((field.state.value as File[]) ?? []).map((file) => (
                          <Box key={file.name}>- {file.name}</Box>
                        ))}
                      </Box>
                    )}
                  </>
                ) : (
                  <Input
                    label={option.label}
                    nativeInputProps={{
                      id: field.name,
                      name: field.name,
                      onBlur: field.handleBlur,
                      onChange: (e) => field.handleChange(e.target.value),
                      required: !(option as FieldConfig).optional,
                      value: field.state.value as string,
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
          <Button type="submit" loading={isSubmitting} disabled={!isValid || !canSubmit || isSubmitting}>
            Envoyer
          </Button>
        )}
      />
    </form>
  );
};

export default ContributionForm;
