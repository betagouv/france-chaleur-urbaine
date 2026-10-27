import { z } from 'zod';

import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { defaultUserPreferences, zNotificationPreferences } from '@/modules/users/constants';

import { NotificationPreferencesFields } from './NotificationPreferencesFields';

const zNotificationPreferencesForm = z.object({
  notifications: zNotificationPreferences,
});

/**
 * Demand notification settings of the authenticated user (`users.preferences.notifications`),
 * saved as soon as a choice changes (no submit button). Only meaningful with a network permission
 * (classic demands) or, for a CCRT, a territorial permission (renewable heat demands).
 */
function NotificationPreferencesForm() {
  const { data: profile, isLoading } = trpc.users.getProfile.useQuery();
  const utils = trpc.useUtils();

  const updatePreferences = trpc.users.updatePreferences.useMutation({
    onError: (error) => notify('error', error.message || 'Erreur lors de la mise à jour des notifications'),
    onSuccess: () => {
      void utils.users.getProfile.invalidate();
      void utils.users.getPreferences.invalidate();
    },
  });

  const form = useAppForm({
    ...schemaValidation(zNotificationPreferencesForm),
    defaultValues: {
      notifications: profile?.preferences.notifications ?? defaultUserPreferences.notifications,
    },
  });

  if (isLoading || !profile) {
    return <Loader variant="section" />;
  }

  if (!profile.notification_scope) {
    return (
      <Notice size="sm" variant="info">
        {profile.role === 'ccrt'
          ? "Les notifications concernent les demandes d'accompagnement chaleur renouvelable de votre territoire : elles s'activent dès qu'une permission territoriale est attribuée à votre compte."
          : "Les notifications concernent les demandes de raccordement affectées à un réseau : elles s'activent dès qu'une permission sur un réseau est attribuée à votre compte."}
      </Notice>
    );
  }

  return (
    <Form form={form}>
      <NotificationPreferencesFields
        form={form}
        fields="notifications"
        scope={profile.notification_scope}
        onFieldChange={(field, value) => {
          updatePreferences.mutate({ notifications: { [field]: value } });
          trackPostHogEvent('account:preference_updated', { preference: `notifications.${field}`, value });
        }}
      />
    </Form>
  );
}

export default NotificationPreferencesForm;
