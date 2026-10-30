import { z } from 'zod';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { useAuthentication } from '@/modules/auth/client/hooks';
import type { MfaEnrollment } from '@/modules/auth/server/mfa';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';

const zMfaVerificationForm = z.object({
  code: z.string().regex(/^\d{6}$/, 'Saisissez le code à 6 chiffres de votre application'),
});

export type MfaVerificationFormProps = {
  /** pending enrollment to display (QR code + manual secret), `null` when the authenticator app is already registered */
  enrollment: MfaEnrollment | null;
  callbackUrl: string;
};

/**
 * Second step of an admin login: registers the authenticator app on first use (QR code), then checks its 6-digit code.
 * A full navigation follows success so that the server session and the client state are rebuilt from the new JWT.
 */
export function MfaVerificationForm({ enrollment, callbackUrl }: MfaVerificationFormProps) {
  const { signIn, signOut } = useAuthentication();

  const form = useAppForm({
    ...schemaValidation(zMfaVerificationForm),
    defaultValues: { code: '' },
    onSubmit: toastErrors(async ({ value }) => {
      const result = await signIn('mfa', { code: value.code, redirect: false });
      if (result?.error) {
        throw new Error(result.error);
      }
      window.location.assign(callbackUrl);
    }),
  });

  return (
    <div className="flex flex-col gap-6">
      {enrollment ? (
        <>
          <Alert variant="info" size="sm">
            Les comptes administrateurs sont protégés par une double authentification. Scannez ce QR code avec une application
            d'authentification (FreeOTP, Aegis, Google Authenticator, Microsoft Authenticator…), puis saisissez le code affiché.
          </Alert>
          <img
            src={enrollment.qrCodeDataUrl}
            alt="QR code à scanner avec votre application d'authentification"
            className="size-48 mx-auto"
          />
          <Text size="sm">
            Si vous ne pouvez pas scanner le QR code, saisissez cette clé dans l'application :{' '}
            <strong className="break-all">{enrollment.secret}</strong>
          </Text>
        </>
      ) : (
        <Text>Saisissez le code à 6 chiffres affiché par votre application d'authentification.</Text>
      )}
      <Form form={form}>
        <form.AppField name="code">
          {(field) => (
            <field.TextField
              label="Code de vérification"
              nativeInputProps={{
                autoComplete: 'one-time-code',
                autoFocus: true,
                inputMode: 'numeric',
                maxLength: 6,
                placeholder: '123456',
              }}
            />
          )}
        </form.AppField>
        <div className="flex justify-between items-center">
          <Button priority="tertiary" onClick={() => signOut({ callbackUrl: '/connexion' })}>
            Se déconnecter
          </Button>
          <form.SubmitButton>Valider</form.SubmitButton>
        </div>
      </Form>
    </div>
  );
}
