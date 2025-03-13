import { Stepper } from '@codegouvfr/react-dsfr/Stepper';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { toastErrors } from '@/services/notification';
import { userRolesInscription } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';

export const zAccountRegisterRequest = z.object({
  email: z.string().email("L'adresse email n'est pas valide").max(100, "L'email ne peut pas dépasser 100 caractères"),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  role: z.enum(userRolesInscription),
  accept_cgu: z.boolean().refine((val) => val === true, {
    message: "Veuillez accepter les conditions générales d'utilisation",
  }),
});

export const zNameSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire'),
  last_name: z.string().min(1, 'Le nom de famille est obligatoire'),
  structure: z.string().min(1, 'La structure est obligatoire'),
  structure_type: z.string(),
  job: z.string().min(1, 'Le poste est obligatoire'),
  email: z.string().email("L'adresse email n'est pas valide"),
  phone: z.string().nullable().optional(),
});

export const zAdditionalInfoSchema = z.object({
  besoins: z.array(z.string()),
});

type FormStep = {
  label: string;
  schema: z.ZodType<any>;
  defaultValues: Record<string, any>;
};

const steps: FormStep[] = [
  {
    label: 'Choisir un identifiant',
    schema: zAccountRegisterRequest,
    defaultValues: {
      email: '',
      password: '',
      accept_cgu: false,
      role: 'professionnel',
    } satisfies AccountRegisterRequest,
  },
  {
    label: 'Choisir un nom',
    schema: zNameSchema,
    defaultValues: {
      first_name: '',
      last_name: '',
      structure: '',
      structure_type: '',
      job: '',
      email: '',
      phone: null,
    } satisfies z.infer<typeof zNameSchema>,
  },
  {
    label: 'Informations complémentaires',
    schema: zAdditionalInfoSchema,
    defaultValues: {
      besoins: [],
    } satisfies z.infer<typeof zAdditionalInfoSchema>,
  },
] as const;

type FormValues = z.infer<typeof zAccountRegisterRequest> & z.infer<typeof zNameSchema> & z.infer<typeof zAdditionalInfoSchema>;

const defaultValues = steps.reduce<FormValues>((acc, curr) => ({ ...acc, ...curr.defaultValues }), {} as FormValues);

export type AccountRegisterRequest = z.infer<typeof zAccountRegisterRequest>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const previousStep = steps[stepIndex - 1];
  const nextStep = steps[stepIndex + 1];
  const [formData, setFormData] = useState(defaultValues);

  const {
    EmailInput,
    PasswordInput,
    Checkbox,
    Submit,
    Form,
    Input,
    Checkboxes,
    Radio,

    Select,
  } = useForm({
    defaultValues: formData,
    schema: step.schema,
    onSubmit: toastErrors(async ({ value }) => {
      const newFormData = { ...formData, ...value };
      setFormData(newFormData);

      if (stepIndex < steps.length - 1) {
        setStepIndex(stepIndex + 1);
      } else {
        if (window.confirm(`Voulez-vous vraiment enregistrer ces informations ${JSON.stringify(newFormData, null, 2)} ?`)) {
          await postFetchJSON('/api/auth/register', value);
          router.push('/inscription/bravo');
        }
      }
    }),
  });

  return (
    <>
      <Stepper currentStep={stepIndex + 1} stepCount={steps.length} title={steps[stepIndex].label} nextTitle={nextStep?.label} />

      <Form>
        <div className="flex flex-col gap-4">
          {stepIndex === 0 && (
            <>
              <EmailInput name="email" label="Email" nativeInputProps={{ placeholder: 'Saisir votre email' }} />
              <PasswordInput name="password" label="Mot de passe" nativeInputProps={{ placeholder: 'Saisir votre mot de passe' }} />
              <Radio
                name="role"
                label="Vous êtes :"
                options={userRolesInscription.map((role) => ({
                  label: upperCaseFirstChar(role),
                  nativeInputProps: {
                    value: role,
                  },
                }))}
              />
              <Checkbox
                name="accept_cgu"
                small
                label={
                  <>
                    J'atteste avoir lu et accepté les&nbsp;
                    <Link href="/mentions-legales" isExternal>
                      conditions générales d'utilisation
                    </Link>
                  </>
                }
              />
            </>
          )}
          {stepIndex === 1 && (
            <>
              <Input name="first_name" label="Prénom" />
              <Input name="last_name" label="Nom de famille" />
              <Input name="structure" label="Structure" />
              <Select
                name="structure_type"
                label="Type de structure"
                options={[
                  { label: "Bureau d'études", value: 'bureau_etudes' },
                  { label: 'Gestionnaire de réseaux de chaleur', value: 'gestionnaire_reseaux' },
                  { label: 'Collectivité', value: 'collectivite' },
                  { label: 'Syndic de copropriété', value: 'syndic_copropriete' },
                  { label: 'Bailleur social', value: 'bailleur_social' },
                  { label: 'Gestionnaire de parc tertiaire', value: 'gestionnaire_parc_tertiaire' },
                  { label: 'Mandataire / délégataire CEE', value: 'mandataire_cee' },
                  { label: 'Autre (préciser)', value: 'autre' },
                ]}
              />
              <Input name="job" label="Poste" />
              <EmailInput name="email" label="Email" />
              <Input name="phone" label="Téléphone" />
            </>
          )}
          {stepIndex === 2 && (
            <>
              <Checkboxes
                name="besoins"
                label="Afin d'enrichir l'espace connecté, partagez-nous vos besoins"
                options={[
                  {
                    label: 'Comparer les coûts et émissions de CO2 de modes de chauffage et de refroidissement',
                    nativeInputProps: {
                      value: 'comparer',
                    },
                  },
                  {
                    label: 'Tester des listes d’adresses',
                    nativeInputProps: {
                      value: 'test',
                    },
                  },
                  {
                    label: 'Réaliser des études sur les potentiels de raccordement / développement de réseaux',
                    nativeInputProps: {
                      value: 'potentiel',
                    },
                  },
                  {
                    label: 'Etre notifié en cas d’actualisation de la carte',
                    nativeInputProps: {
                      value: 'actualisation',
                    },
                  },
                  {
                    label: 'Intégrer une communauté de professionnels sur les réseaux de chaleur',
                    nativeInputProps: {
                      value: 'communaute',
                    },
                  },
                  {
                    label: 'Faire connaître mon parc de bâtiments aux collectivités et gestionnaires de réseaux',
                    nativeInputProps: {
                      value: 'presentation',
                    },
                  },
                  {
                    label: 'Autre',
                    nativeInputProps: {
                      value: 'autre',
                    },
                  },
                ]}
              />
            </>
          )}
          <div className="flex justify-between text-sm mb-8 items-center">
            {previousStep ? (
              <Button priority="secondary" onClick={() => setStepIndex(stepIndex - 1)}>
                Précedent
              </Button>
            ) : (
              <Link href={`/connexion?${searchParams.toString()}`}>Se connecter</Link>
            )}
            <Submit>Valider</Submit>
          </div>
        </div>
      </Form>
    </>
  );
}

export default RegisterForm;
