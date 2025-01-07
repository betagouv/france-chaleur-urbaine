import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import { type FormState, standardSchemaValidator, useForm, useStore } from '@tanstack/react-form';
import { z, type ZodSchema } from 'zod';

import Input from '@/components/form/dsfr/Input';
import Button from '@/components/ui/Button';
import { toastErrors } from '@/services/notification';
import { nonEmptyArray } from '@/utils/typescript';

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
    },
    {
      name: 'localisation',
      label: 'Localisation :',
    },
    {
      name: 'gestionnaire',
      label: 'Gestionnaire :',
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
    },
    {
      name: 'emailReferentCommercial',
      label: 'Email du référent commercial à qui transmettre les demandes de raccordement',
      optional: true,
    },
    {
      name: 'commentaire',
      label: 'Commentaire :',
      optional: true,
    },
  ],
  'ajout tracé réseau en construction': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau :',
    },
    {
      name: 'localisation',
      label: 'Localisation :',
    },
    {
      name: 'gestionnaire',
      label: 'Gestionnaire :',
    },
    {
      name: 'dateMiseEnServicePrevisionnelle',
      label: 'Date de mise en service prévisionnelle :',
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
    },
    {
      name: 'emailReferentCommercial',
      label: 'Email du référent commercial à qui transmettre les demandes de raccordement',
      optional: true,
    },
    {
      name: 'commentaire',
      label: 'Commentaire :',
      optional: true,
    },
  ],
  'ajout périmètre développement prioritaire': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau :',
    },
    {
      name: 'localisation',
      label: 'Localisation :',
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
    },
  ],
  'ajout schéma directeur': [
    {
      name: 'nomReseau',
      label: 'Nom du réseau ou du territoire concerné :',
    },
    {
      name: 'fichiers',
      label: 'Téléverser vos fichiers :',
      type: 'file',
    },
  ],
  'signaler une erreur': [
    {
      name: 'precisions',
      label: 'Précisez :',
    },
  ],
  autre: [
    {
      name: 'precisions',
      label: 'Précisez :',
    },
  ],
} as const satisfies Record<TypeDemande, FieldConfig[]>;

const zEmptyString = z.literal('');

export const zFormData = z.object({
  typeUtilisateur: z.enum(nonEmptyArray(typesUtilisateur.map((w) => w.key)), { message: 'Ce choix est obligatoire' }).or(zEmptyString),
  typeUtilisateurAutre: z.string(),
  email: z.string().email("L'adresse email n'est pas valide"),
  dansCadreDemandeADEME: z.boolean({ message: 'Ce choix est obligatoire' }),
  typeDemande: z.enum(nonEmptyArray(typesDemande.map((w) => w.key)), { message: 'Ce choix est obligatoire' }).or(zEmptyString),

  fichiers: z.array(z.instanceof(File)),
  // si discriminatedUnion on perd le typage
  // nomReseau: z.string(),
  // localisation: z.string(),
  // gestionnaire: z.string(),
  // dateMiseEnServicePrevisionnelle: z.string(),
  // emailReferentCommercial: z.string().optional(),
  // commentaire: z.string().optional(),
});

export type FormData = z.infer<typeof zFormData>;

const ContributionForm = ({ submit }: { submit: (data: any) => void }) => {
  const form = useForm({
    defaultValues: {
      typeUtilisateur: '',
      typeUtilisateurAutre: '',
      email: '',
      typeDemande: '',
      dansCadreDemandeADEME: '',
      fichiers: [],
      // nomReseau: '',
      // localisation: '',
      // gestionnaire: '',
      // dateMiseEnServicePrevisionnelle: '',
      // emailReferentCommercial: '',
      // commentaire: '',
      // } satisfies Record<keyof FormData, ''> as any,
    } satisfies Record<keyof FormData, '' | []> as unknown as FormData,
    validatorAdapter: standardSchemaValidator(),
    validators: {
      onChange: zFormData,
    },
    onSubmit: toastErrors(async ({ value }) => {
      // console.log('submit', {
      //     Email: value.email,
      //     Utilisateur: user === 'autre' ? otherUser : user,
      //     'Réseau(x)': network,
      //     Souhait: wish,
      //     'Ajout de': additionWish.map((value) => (value === 'autre' ? `Autre : ${otherAdditionWish}` : value)).join(', '),
      //     Précisions: otherWish,
      //     'Nom gestionnaire': nomGestionnaireWish,
      //     'Date mise en service': dateWish,
      //   });
      // if ((wish === 'Ajout de données' || wish === 'Déposer des éléments') && additionWish.length === 0) {
      //   setAdditionWishEmpty(true);
      //   return;
      // }
      // setAdditionWishEmpty(false);
      // submit({
      //   Email: email,
      //   Utilisateur: user === 'autre' ? otherUser : user,
      //   'Réseau(x)': network,
      //   Souhait: wish,
      //   'Ajout de': additionWish.map((value) => (value === 'autre' ? `Autre : ${otherAdditionWish}` : value)).join(', '),
      //   Précisions: otherWish,
      //   'Nom gestionnaire': nomGestionnaireWish,
      //   'Date mise en service': dateWish,
      // });
    }),
  });
  const formState = useStore(form.store, (state) => state.values);
  const formErrors = useStore(form.store, (state) => state.errors);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <pre style={{ fontSize: '10px', lineHeight: '1.2em' }}>formState = {JSON.stringify(formState, null, 2)}</pre>
      <pre style={{ fontSize: '10px', lineHeight: '1.2em' }}>formErrors = {JSON.stringify(formErrors, null, 2)}</pre>
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
            state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
            stateRelatedMessage={field.state.meta.isTouched && field.state.meta.errors.join(', ')}
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
                  state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
                  stateRelatedMessage={field.state.meta.isTouched && field.state.meta.errors.join(', ')}
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
            state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
            stateRelatedMessage={field.state.meta.isTouched && field.state.meta.errors.join(', ')}
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
            state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
            stateRelatedMessage={field.state.meta.isTouched && field.state.meta.errors.join(', ')}
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
            state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
            stateRelatedMessage={field.state.meta.isTouched && field.state.meta.errors.join(', ')}
          />
        )}
      />

      <form.Subscribe
        selector={(state: FormState<FormData>) => state.values.typeDemande}
        children={(typeDemande) => (
          <>
            {typeDemande !== '' &&
              typeDemandeFields[typeDemande].map((option) => (
                <form.Field
                  name={option.name}
                  key={option.name}
                  children={(field) => (
                    <Input
                      label={option.label}
                      nativeInputProps={{
                        required: !option.optional,
                        id: field.name,
                        name: field.name,
                        value: field.state.value,
                        onChange: (e) => field.handleChange(e.target.value),
                        onBlur: field.handleBlur,
                      }}
                      state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
                      stateRelatedMessage={field.state.meta.isTouched && field.state.meta.errors.join(', ')}
                    />
                  )}
                />
              ))}
          </>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            Envoyer
          </Button>
        )}
      />
    </form>
  );
};

export default ContributionForm;
