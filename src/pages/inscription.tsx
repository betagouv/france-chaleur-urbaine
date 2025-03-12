import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import CenterLayout from '@/components/shared/page/CenterLayout';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
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

function InscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { EmailInput, PasswordInput, Checkbox, Submit, Form } = useForm({
    defaultValues: {
      email: '',
      password: '',
      acceptCGU: false,
      role: 'professionnel',
    } as AccountRegisterRequest,
    schema: zAccountRegisterRequest,
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

        <Form>
          <Box display="flex" flexDirection="column" gap="16px">
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
            <div className="flex justify-between flex-row-reverse text-sm mb-8 items-center">
              <Link href={`/connexion?${searchParams.toString()}`}>Se connecter</Link>
              <Submit>S'inscrire</Submit>
            </div>
          </Box>
        </Form>
      </CenterLayout>
    </SimplePage>
  );
}

export default InscriptionPage;
