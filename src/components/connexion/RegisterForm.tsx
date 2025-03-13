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

export const zAccountRegisterRequest = z.object({
  email: z.string().email("L'adresse email n'est pas valide").max(100, "L'email ne peut pas dépasser 100 caractères"),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  role: z.enum(userRolesInscription),
  acceptCGU: z.boolean().refine((val) => val === true, {
    message: "Veuillez accepter les conditions générales d'utilisation",
  }),
});

export const zNameSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
});

export const zAdditionalInfoSchema = z.object({
  besoins: z.string().min(1, 'Le nom est obligatoire'),
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
      acceptCGU: false,
      role: 'professionnel' as const,
    } satisfies AccountRegisterRequest,
  },
  {
    label: 'Choisir un nom',
    schema: zNameSchema,
    defaultValues: {
      name: '',
    } satisfies z.infer<typeof zNameSchema>,
  },
  {
    label: 'Informations complémentaires',
    schema: zAdditionalInfoSchema,
    defaultValues: {
      besoins: 'test default',
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

  const { EmailInput, PasswordInput, Checkbox, Submit, Form, Input } = useForm({
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

              {/* TODO pas encore géré */}
              {/* <form.Field
              name="role"
              children={(field) => (
                <Select
                  label="Role"
                  options={userRolesInscription.map((role) => ({
                    value: role,
                    label: upperCaseFirstChar(role),
                  }))}
                  nativeSelectProps={{
                    required: true,
                    id: field.name,
                    name: field.name,
                    value: field.state.value,
                    onChange: (e) => field.handleChange(e.target.value),
                    onBlur: field.handleBlur,
                  }}
                />
              )}
            /> */}
              <Checkbox
                name="acceptCGU"
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
              <Input name="name" label="Nom" />
            </>
          )}
          {stepIndex === 2 && (
            <>
              <Input name="besoins" label="Besoins" />
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
