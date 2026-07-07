import type { ComponentProps, ReactNode } from 'react';

import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';

type ConfirmDialogProps<T> = {
  control: DialogControl<T>;
  title: string;
  /** Taille du dialog (défaut `sm`). */
  size?: 'sm' | 'md' | 'lg';
  /** Corps du message (ex. « Êtes-vous sûr… »). */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style destructif (bouton rouge + icône corbeille). */
  danger?: boolean;
  /** Icône du bouton Confirmer (défaut : corbeille quand `danger`). */
  confirmIconId?: ComponentProps<typeof AsyncButton>['iconId'];
  /** Désactive « Confirmer » (ex. pendant un chargement de contexte). */
  confirmDisabled?: boolean;
  /** Action confirmée. Le dialog se ferme uniquement en cas de succès ; en cas d'erreur il reste ouvert. */
  onConfirm: (data: T) => void | Promise<void>;
};

/** Dialog de confirmation générique (annuler / confirmer) — brique commune de l'app. */
const ConfirmDialog = <T,>({
  control,
  title,
  size = 'sm',
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger,
  confirmIconId,
  confirmDisabled,
  onConfirm,
}: ConfirmDialogProps<T>) => {
  // Fermé uniquement en cas de succès : sur erreur, l'`await` lève et `close()` est sauté → le dialog reste ouvert.
  const handleConfirm = async () => {
    await onConfirm(control.data as T);
    control.close();
  };

  return (
    <Dialog {...control.dialogProps} title={title} size={size}>
      <div className="flex flex-col gap-4">
        {children && <div>{children}</div>}
        <div className="flex justify-between gap-2">
          <Button priority="tertiary" onClick={control.close}>
            {cancelLabel}
          </Button>
          <AsyncButton
            priority="primary"
            variant={danger ? 'destructive' : undefined}
            iconId={confirmIconId ?? (danger ? 'fr-icon-delete-line' : undefined)}
            disabled={confirmDisabled}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </AsyncButton>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;
