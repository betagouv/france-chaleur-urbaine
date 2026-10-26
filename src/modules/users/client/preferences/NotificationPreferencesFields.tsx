import { businessRules } from '@/modules/app/business-rules';
import { withFieldGroup } from '@/modules/form/useAppForm';
import { defaultUserPreferences, type NotificationPreferences } from '@/modules/users/constants';

type NotificationPreferencesFieldsProps = {
  /** Called after a field changes — lets the host form save immediately (no submit button). */
  onFieldChange?: <Field extends keyof NotificationPreferences>(field: Field, value: NotificationPreferences[Field]) => void;
};

/**
 * Demand notification preferences (`users.preferences.notifications`) as a TanStack Form field group,
 * shared by the admin user form and the user's account page: one block per notification type,
 * with its options inline. Mount with `form` + `fields="notifications"`.
 */
export const NotificationPreferencesFields = withFieldGroup<NotificationPreferences, unknown, NotificationPreferencesFieldsProps>({
  defaultValues: defaultUserPreferences.notifications,
  // biome-ignore lint: a named PascalCase function is required for the hooks rules (an inline `render()` method is not seen as a component)
  render: function NotificationPreferencesFieldsRender({ group, onFieldChange }) {
    return (
      <div className="flex flex-col gap-6">
        <group.AppField name="new_demands" listeners={{ onChange: ({ value }) => onFieldChange?.('new_demands', value) }}>
          {(field) => (
            <field.RadioField
              label="Nouvelles demandes de raccordement"
              hintText="Email récapitulatif des nouvelles demandes affectées à vos réseaux : chaque jour ouvré à 10h, ou toutes les demandes de la semaine le lundi à 10h."
              orientation="horizontal"
              options={[
                { label: 'Quotidien', nativeInputProps: { value: 'daily' } },
                { label: 'Hebdomadaire', nativeInputProps: { value: 'weekly' } },
                { label: 'Désactivé', nativeInputProps: { value: 'none' } },
              ]}
            />
          )}
        </group.AppField>
        <group.AppField
          name="pending_demands_reminder"
          listeners={{ onChange: ({ value }) => onFieldChange?.('pending_demands_reminder', value) }}
        >
          {(field) => (
            <field.BooleanRadioField
              label="Rappel des demandes en attente"
              hintText={`Email le mardi si des demandes sont restées « À traiter » plus de ${businessRules.unhandledDemandReminderDays.display} après leur notification.`}
              orientation="horizontal"
              yesLabel="Activé"
              noLabel="Désactivé"
            />
          )}
        </group.AppField>
      </div>
    );
  },
});
