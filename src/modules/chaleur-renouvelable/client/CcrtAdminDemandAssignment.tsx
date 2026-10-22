import { useEffect } from 'react';

import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { zAdminUpdateDemandeChaleurRenouvelableInput } from '../constants';
import type { CcrtDemand } from '../types';
import { invalidateCcrtDemand } from './ccrt-demand-cache';

const zCcrtAdminAssignment = zAdminUpdateDemandeChaleurRenouvelableInput.shape.values.pick({ assignedTo: true });

type CcrtAdminDemandAssignmentProps = {
  demand: Pick<CcrtDemand, 'id' | 'assigned_to'>;
};

/**
 * Offers CCRT accounts whose territorial permissions cover this demand.
 */
export function CcrtAdminDemandAssignment({ demand }: CcrtAdminDemandAssignmentProps) {
  const candidates = trpc.batEnr.admin.listAssignmentCandidates.useQuery({ demandId: demand.id });
  const options = (candidates.data ?? []).map((user) => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return { label: fullName ? `${fullName} (${user.email})` : user.email, value: user.email };
  });
  // Keep a historical assignment visible even if its account no longer covers this demand.
  if (demand.assigned_to && !options.some((option) => option.value === demand.assigned_to)) {
    options.push({ label: demand.assigned_to, value: demand.assigned_to });
  }
  const mutation = trpc.batEnr.admin.updateDemandeChaleurRenouvelable.useMutation();
  const utils = trpc.useUtils();
  const form = useAppForm({
    ...schemaValidation(zCcrtAdminAssignment),
    defaultValues: zCcrtAdminAssignment.parse({ assignedTo: demand.assigned_to ?? '' }),
    onSubmit: toastErrors(async ({ value }) => {
      await mutation.mutateAsync({
        demandId: demand.id,
        values: { assignedTo: value.assignedTo || null },
      });
      form.reset(value);
      await invalidateCcrtDemand(utils, demand.id);
    }),
  });

  // Refresh a saved assignment without discarding a pending local change.
  useEffect(() => {
    if (!form.state.isDirty) {
      form.reset({ assignedTo: demand.assigned_to ?? '' });
    }
  }, [demand.assigned_to, form]);

  return (
    <Form form={form} className="mb-4 border border-(--border-default-grey) bg-(--background-default-grey) p-4">
      <form.AppField name="assignedTo" listeners={{ onChange: () => void form.handleSubmit() }}>
        {(field) => (
          <field.SelectField
            label="Affecté à"
            hideOptionalLabel
            options={[{ label: 'Non affecté', value: '' }, ...options]}
            disabled={mutation.isPending || candidates.isLoading || candidates.isError}
            hint={
              candidates.isError
                ? 'Impossible de charger les comptes CCRT. Veuillez réessayer.'
                : candidates.isLoading
                  ? 'Chargement des comptes CCRT…'
                  : candidates.data?.length === 0
                    ? 'Aucun compte CCRT actif ne dispose d’une permission couvrant cette demande.'
                    : undefined
            }
          />
        )}
      </form.AppField>
    </Form>
  );
}
