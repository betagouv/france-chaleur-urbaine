import { useRouter } from 'next/router';
import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import CenterLayout from '@/components/shared/page/CenterLayout';
import Heading from '@/components/ui/Heading';
import { useServices } from '@/services';
import { toastErrors } from '@/services/notification';
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Votre mot de passe doit avoir au moins 8 caractères')
      .regex(/[a-z]/, 'Votre mot de passe doit contenir au moins une lettre minuscule')
      .regex(/[A-Z]/, 'Votre mot de passe doit contenir au moins une lettre majuscule')
      .regex(/[0-9]/, 'Votre mot de passe doit contenir au moins un chiffre'),
    confirmation: z.string(),
  })
  .refine((data) => data.password === data.confirmation, {
    message: 'Les mots de passe sont différents',
    path: ['confirmation'],
  });

const NewPasswordForm = ({ token }: { token: string }) => {
  const { passwordService } = useServices();
  const router = useRouter();

  const { Form, PasswordInput, Submit } = useForm({
    schema: passwordSchema,
    onSubmit: toastErrors(async ({ value }) => {
      try {
        await passwordService.changePassword(token, value.password);
        router.push(
          `/connexion?notify=success:${encodeURIComponent('Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.')}`
        );
      } catch (e: any) {
        throw new Error(e.response.data.error?.issues?.[0]?.message ?? e.response.data.message);
      }
    }),
  });

  return (
    <CenterLayout maxWidth="500px">
      <Heading as="h1" size="h2">
        Réinitialisation du mot de passe
      </Heading>
      <Form className="flex flex-col gap-4">
        <PasswordInput name="password" label="Mot de passe" />
        <PasswordInput name="confirmation" label="Confirmer" />
        <Submit>Changer mon mot de passe</Submit>
      </Form>
    </CenterLayout>
  );
};

export default NewPasswordForm;
