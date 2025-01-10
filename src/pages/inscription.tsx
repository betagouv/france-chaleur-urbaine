import { PasswordInput } from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import Input from '@codegouvfr/react-dsfr/Input';
import { standardSchemaValidator, useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import CenterLayout from '@/components/shared/page/CenterLayout';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import { toastErrors } from '@/services/notification';
import { userRolesInscription } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';

export const zAccountRegisterRequest = z.strictObject({
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
export type AccountRegisterRequest = z.infer<typeof zAccountRegisterRequest>;

export default function InscriptionPage() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      acceptCGU: false,
      role: 'professionnel',
    } as AccountRegisterRequest,
    validatorAdapter: standardSchemaValidator(),
    validators: {
      onChange: zAccountRegisterRequest,
    },
    onSubmit: toastErrors(async ({ value }) => {
      await postFetchJSON('/api/auth/register', value);
      router.push('/inscription/bravo');
    }),
  });

  return (
    <SimplePage title="Création d'un compte connecté" description="Connectez-vous à votre compte France Chaleur Urbaine.">
      <CenterLayout maxWidth="600px">
        <Heading as="h1" size="h2" color="blue-france">
          Créer votre compte
        </Heading>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Box display="flex" flexDirection="column" gap="16px">
            <form.Field
              name="email"
              children={(field) => (
                <Input
                  label="Email"
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
                  stateRelatedMessage={field.state.meta.errors.join(', ')}
                />
              )}
            />
            <form.Field
              name="password"
              children={(field) => (
                <PasswordInput
                  label="Mot de passe"
                  nativeInputProps={{
                    required: true,
                    id: field.name,
                    name: field.name,
                    placeholder: 'Saisir votre mot de passe',
                    autoComplete: 'password',
                    value: field.state.value,
                    onChange: (e) => field.handleChange(e.target.value),
                    onBlur: field.handleBlur,
                  }}
                  messages={
                    field.state.meta.isTouched
                      ? field.state.meta.errors.map((e) => ({
                          message: e,
                          severity: 'error',
                        }))
                      : []
                  }
                />
              )}
            />
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
            <form.Field
              name="acceptCGU"
              children={(field) => (
                <Checkbox
                  small
                  options={[
                    {
                      label: (
                        <>
                          J'atteste avoir lu et accepté les&nbsp;
                          <Link href="/mentions-legales" isExternal>
                            conditions générales d'utilisation
                          </Link>
                        </>
                      ),
                      nativeInputProps: {
                        name: field.name,
                        onChange: (e) => field.handleChange(e.target.checked),
                      },
                    },
                  ]}
                  state={field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default'}
                  stateRelatedMessage={field.state.meta.errors.join(', ')}
                />
              )}
            />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? '...' : "S'inscrire"}
                </Button>
              )}
            />
          </Box>
        </form>
      </CenterLayout>
    </SimplePage>
  );
}
