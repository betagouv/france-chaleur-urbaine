import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/SelectNext';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { notify, toastErrors } from '@/services/notification';
import { userRoles } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';

export const zCreateUserRequest = z.strictObject({
  email: z.string().email(),
  role: z.enum(userRoles),
});
type CreateUserRequest = z.infer<typeof zCreateUserRequest>;

const AccountCreationForm = () => {
  const form = useForm({
    defaultValues: {
      email: '',
      role: 'professionnel',
    } as CreateUserRequest,
    validators: {
      onChange: zCreateUserRequest,
    },
    onSubmit: toastErrors(async ({ value }) => {
      await postFetchJSON('/api/admin/users', value);
      notify('success', "L'utilisateur a été créé avec succès. Il recevra un email l'invitant à définir son mot de passe.");
    }),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Box display="flex" alignItems="center" gap="16px">
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
            />
          )}
        />
        <form.Field
          name="role"
          children={(field) => (
            <Select
              label="Role"
              options={userRoles.map((role) => ({
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
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? '...' : "Envoyer l'invitation"}
            </Button>
          )}
        />
      </Box>
    </form>
  );
};

export default AccountCreationForm;
