import Alert from '@codegouvfr/react-dsfr/Alert';
import RadioButtons, { type RadioButtonsProps } from '@codegouvfr/react-dsfr/RadioButtons';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { type FieldApi, type FormState, standardSchemaValidator, useForm } from '@tanstack/react-form';
import { useEffect, useState } from 'react';
import { z, type ZodSchema } from 'zod';

import Input from '@/components/form/dsfr/Input';
import Button from '@/components/ui/Button';
import { submitToAirtable } from '@/services/airtable';
import { toastErrors } from '@/services/notification';
import { Airtable } from '@/types/enum/Airtable';
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
  schema?: ZodSchema;
  type?: 'string' | 'file';
};

const typeDemandeFields = {
  'ajout tracé réseau existant': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau :',
      schema: z.string(),
    },
    {
      name: 'localisation',
      label: 'Localisation :',
      schema: z.string(),
    },
    {
      name: 'gestionnaire',
      label: 'Gestionnaire :',
      schema: z.string(),
    },
    // {
    //   name: 'fichiers',
    //   label: 'Téléverser vos fichiers :',
    //   type: 'file',
    //   schema: z.array(z.instanceof(File)),
    // },
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
      schema: z.string(),
    },
    {
      name: 'localisation',
      label: 'Localisation :',
      schema: z.string(),
    },
    {
      name: 'gestionnaire',
      label: 'Gestionnaire :',
      schema: z.string(),
    },
    {
      name: 'dateMiseEnServicePrevisionnelle',
      label: 'Date de mise en service prévisionnelle :',
      schema: z.string(),
    },
    // {
    //   name: 'fichiers',
    //   label: 'Téléverser vos fichiers :',
    //   type: 'file',
    //   schema: z.array(z.instanceof(File)),
    // },
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
      schema: z.string(),
    },
    {
      name: 'localisation',
      label: 'Localisation :',
      schema: z.string(),
    },
    // {
    //   name: 'fichiers',
    //   label: 'Téléverser vos fichiers :',
    //   type: 'file',
    //   schema: z.array(z.instanceof(File)),
    // },
  ],
  'ajout schéma directeur': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau ou du territoire concerné :',
      schema: z.string(),
    },
    // {
    //   name: 'fichiers',
    //   label: 'Téléverser vos fichiers :',
    //   type: 'file',
    //   schema: z.array(z.instanceof(File)),
    // },
  ],
  'signaler une erreur': [
    {
      name: 'precisions',
      label: 'Précisez :',
      schema: z.string({ message: 'Ce champ est obligatoire', required_error: 'obligatoire' }),
    },
  ],
  autre: [
    {
      name: 'precisions',
      label: 'Précisez :',
      schema: z.string(),
    },
  ],
} as const satisfies Record<TypeDemande, FieldConfig[]>;

export const zCommonFormData = z.object({
  typeUtilisateur: z.enum(nonEmptyArray(typesUtilisateur.map((w) => w.key)), { message: 'Ce choix est obligatoire' }),
  typeUtilisateurAutre: z.string(),
  email: z.string().email("L'adresse email n'est pas valide"),
  dansCadreDemandeADEME: z.boolean({ message: 'Ce choix est obligatoire' }),
});

const zodSchemasByTypeDemande = ObjectKeys(typeDemandeFields).reduce(
  (acc, key) => ({
    ...acc,
    [key]: typeDemandeFields[key].reduce(
      (acc2, field) => ({
        ...acc2,
        [field.name]: (field as FieldConfig).schema ?? z.string(),
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

const zFormData = z.discriminatedUnion(
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
type FormData = AddEmptyValues<z.infer<typeof zFormData>>;

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
      onChange: zFormData,
    },
    onSubmit: toastErrors(
      async ({ value }: { value: FormData }) => {
        console.log('submit', value);
        // ca serait mieux que zod ne récupère que ce qui est utile
        console.log('parsed', zFormData.parse(value));
        const airtableData = {
          Utilisateur: value.typeUtilisateur === 'Autre' ? value.typeUtilisateurAutre : value.typeUtilisateur,
          Email: value.email,
          'Cadre subvention ADEME': value.dansCadreDemandeADEME,
          Souhait: value.typeDemande,
          'Réseau(x)': (value as any).nomReseau,
          Localisation: (value as any).localisation,
          'Nom gestionnaire': (value as any).gestionnaire,
          'Date mise en service': (value as any).dateMiseEnServicePrevisionnelle,
          'Référent commercial': (value as any).emailReferentCommercial,
          Précisions: (value as any).precisions ?? (value as any).commentaire,
        };
        console.log('airtableData', airtableData);
        await submitToAirtable(airtableData, Airtable.CONTRIBUTION);
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
                  onChange: () => field.handleChange(true),
                  onBlur: field.handleBlur,
                },
              },
              {
                label: 'non',
                nativeInputProps: {
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
        children={(field) => (
          <RadioButtons
            legend="Vous souhaitez :"
            name={field.name}
            options={typesDemande.map((option) => ({
              label: option.label,
              nativeInputProps: {
                required: true,
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
                    label={option.label}
                    hint=""
                    nativeInputProps={{
                      accept: '.csv',
                      onChange: (e) => field.handleChange(e.target.value),
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
