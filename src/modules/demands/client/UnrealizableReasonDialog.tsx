import { useStore } from '@tanstack/react-form';
import { useEffect } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useAuthentication } from '@/modules/auth/client/hooks';
import {
  selectableUnrealizableReasons,
  UNREALIZABLE_REASON_INVALID_DEMAND,
  UNREALIZABLE_REASON_OTHER,
  type UnrealizableReasonForm,
  zUnrealizableReasonForm,
} from '@/modules/demands/constants';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';

import { getUnrealizableDialogContext, type UnrealizableDialogSource, type UnrealizableTrackedDemand } from './unrealizable-tracking';

type UnrealizableReasonDialogProps = {
  demand: UnrealizableTrackedDemand;
  open: boolean;
  source: UnrealizableDialogSource;
  onCancel: () => void;
  /** Applies the status change with the chosen reason; the dialog stays open while it runs. */
  onConfirm: (reason: UnrealizableReasonForm) => Promise<void>;
};

/**
 * Asks why a demand is not feasible before it becomes « Non réalisable »:
 * nothing is saved and no email leaves until the reason is confirmed.
 */
export function UnrealizableReasonDialog({ demand, open, source, onCancel, onConfirm }: UnrealizableReasonDialogProps) {
  const { user } = useAuthentication();
  const trackingContext = getUnrealizableDialogContext(demand, user?.role, source);

  // one "opened" event per opening of the dialog
  useEffect(() => {
    if (open) {
      trackPostHogEvent('demand:unrealizable_dialog_opened', trackingContext);
    }
  }, [open]);

  const handleCancel = () => {
    trackPostHogEvent('demand:unrealizable_dialog_closed', { ...trackingContext, outcome: 'cancelled' });
    onCancel();
  };

  const handleConfirm = async (reason: UnrealizableReasonForm) => {
    await onConfirm(reason);
    trackPostHogEvent('demand:unrealizable_dialog_closed', {
      ...trackingContext,
      has_detail: reason.unrealizable_detail !== '',
      outcome: 'confirmed',
      reason: reason.unrealizable_reason,
    });
  };

  return (
    <Dialog
      title="Pourquoi cette demande n'est-elle pas réalisable ?"
      size="lg"
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <UnrealizableReasonFormContent onCancel={handleCancel} onConfirm={handleConfirm} />
    </Dialog>
  );
}

type UnrealizableReasonFormContentProps = Pick<UnrealizableReasonDialogProps, 'onCancel' | 'onConfirm'>;

const defaultValues: { unrealizable_detail: string; unrealizable_reason: UnrealizableReasonForm['unrealizable_reason'] | '' } = {
  unrealizable_detail: '',
  unrealizable_reason: '',
};

/**
 * Content of the reason dialog, mounted with it so that every opening starts from an empty form.
 */
function UnrealizableReasonFormContent({ onCancel, onConfirm }: UnrealizableReasonFormContentProps) {
  const form = useAppForm({
    ...schemaValidation(zUnrealizableReasonForm),
    defaultValues,
    onSubmit: async ({ value }) => {
      await onConfirm(zUnrealizableReasonForm.parse(value));
    },
  });
  const selectedReasonKey = useStore(form.store, (state) => state.values.unrealizable_reason);
  const selectedReason = selectableUnrealizableReasons.find((reason) => reason.key === selectedReasonKey);

  return (
    <Form form={form}>
      <p>
        Votre réponse nous aide à vous transmettre des demandes plus pertinentes. Elle est visible par France Chaleur Urbaine et par la
        collectivité concernée, mais pas par le demandeur.
      </p>
      <form.AppField name="unrealizable_reason">
        {(field) => (
          <field.RadioField
            label="Motif"
            small
            options={selectableUnrealizableReasons.map((reason) => ({ label: reason.label, nativeInputProps: { value: reason.key } }))}
          />
        )}
      </form.AppField>
      <form.AppField name="unrealizable_detail">
        {(field) => (
          <field.TextareaField
            label="Précision"
            hintText={selectedReason?.detailHint ?? 'Précision facultative'}
            nativeTextAreaProps={{ required: selectedReasonKey === UNREALIZABLE_REASON_OTHER, rows: 3 }}
          />
        )}
      </form.AppField>
      <p className="font-bold mb-1">Ce n'est pas un refus ?</p>
      <ul className="mb-4">
        <li>Le demandeur ne donne pas suite : choisissez « Projet abandonné par le prospect ».</li>
        <li>L'étude est en cours : choisissez « Recontacté pour étude ».</li>
        <li>La demande ne concerne pas votre réseau : changez son affectation.</li>
      </ul>
      {selectedReasonKey !== UNREALIZABLE_REASON_INVALID_DEMAND && (
        <p>
          Après confirmation, le demandeur sera informé que le raccordement ne peut pas être envisagé, et d'autres solutions de chauffage
          lui seront proposées.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <form.SubmitButton disabled={selectedReasonKey === ''}>Confirmer</form.SubmitButton>
      </div>
    </Form>
  );
}
