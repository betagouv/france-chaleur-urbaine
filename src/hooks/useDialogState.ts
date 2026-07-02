import { useCallback, useState } from 'react';

/** Contrôle d'un dialog : ouverture/fermeture + payload optionnel `T`. */
export type DialogControl<T = void> = {
  isOpen: boolean;
  data: T | undefined;
  open: (data: T) => void;
  close: () => void;
  /** À spreader dans le composant `Dialog` contrôlé. */
  dialogProps: { open: boolean; onOpenChange: (open: boolean) => void };
};

/**
 * Gère l'état d'un dialog (ouvert/fermé) avec un payload optionnel `T`.
 * Une instance par dialog — brique commune des dialogs de l'app (cf. `ConfirmDialog`).
 *
 * @example
 *   const edit = useDialogState<Org>();
 *   // edit.open(org) / edit.close() / edit.isOpen / edit.data
 *   <Dialog {...edit.dialogProps} title="…">{edit.isOpen && <Form org={edit.data} />}</Dialog>
 */
export function useDialogState<T = void>(): DialogControl<T> {
  const [state, setState] = useState<{ data: T } | null>(null);
  const open = useCallback((data: T) => setState({ data }), []);
  const close = useCallback(() => setState(null), []);
  return {
    close,
    data: state?.data,
    dialogProps: {
      onOpenChange: (isOpen) => {
        if (!isOpen) setState(null);
      },
      open: state !== null,
    },
    isOpen: state !== null,
    open,
  };
}
