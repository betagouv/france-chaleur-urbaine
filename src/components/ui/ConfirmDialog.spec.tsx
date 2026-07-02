import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useDialogState } from '@/hooks/useDialogState';

import ConfirmDialog from './ConfirmDialog';

type Payload = { id: string };

const TITLE = "Supprimer l'élément";
const PAYLOAD: Payload = { id: '42' };

function Harness({ onConfirm, confirmDisabled }: { onConfirm: (data: Payload) => Promise<void> | void; confirmDisabled?: boolean }) {
  const control = useDialogState<Payload>();
  return (
    <>
      <button type="button" onClick={() => control.open(PAYLOAD)}>
        ouvrir
      </button>
      <ConfirmDialog
        control={control}
        title={TITLE}
        confirmLabel="Supprimer"
        danger
        confirmDisabled={confirmDisabled}
        onConfirm={onConfirm}
      >
        Message de confirmation
      </ConfirmDialog>
    </>
  );
}

const button = (name: string) => screen.getByRole('button', { name });

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(button('ouvrir'));
  await screen.findByText(TITLE);
};

/** Monte le Harness et ouvre le dialog (sauf `open: false`) ; renvoie `user` et le mock `onConfirm`. */
const renderDialog = async (
  opts: { onConfirm?: (data: Payload) => Promise<void> | void; confirmDisabled?: boolean; open?: boolean } = {}
) => {
  const onConfirm = opts.onConfirm ?? vi.fn();
  const user = userEvent.setup();
  render(<Harness onConfirm={onConfirm} confirmDisabled={opts.confirmDisabled} />);
  if (opts.open !== false) await openDialog(user);
  return { onConfirm, user };
};

describe('ConfirmDialog', () => {
  it('is closed by default and opens with title + content + buttons', async () => {
    const { user } = await renderDialog({ open: false });
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();

    await openDialog(user);

    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText('Message de confirmation')).toBeInTheDocument();
    expect(button('Supprimer')).toBeInTheDocument();
    expect(button('Annuler')).toBeInTheDocument();
  });

  it('closes on cancel without confirming', async () => {
    const { user, onConfirm } = await renderDialog();

    await user.click(button('Annuler'));

    await waitFor(() => expect(screen.queryByText(TITLE)).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with the payload then closes on success', async () => {
    const { user, onConfirm } = await renderDialog({ onConfirm: vi.fn().mockResolvedValue(undefined) });

    await user.click(button('Supprimer'));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(PAYLOAD));
    await waitFor(() => expect(screen.queryByText(TITLE)).not.toBeInTheDocument());
  });

  it('stays open when onConfirm rejects (close only on success)', async () => {
    const { user, onConfirm } = await renderDialog({ onConfirm: vi.fn().mockRejectedValue(new Error('boom')) });

    await user.click(button('Supprimer'));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(screen.getByText(TITLE)).toBeInTheDocument();
  });

  it('disables the confirm button when confirmDisabled is set', async () => {
    await renderDialog({ confirmDisabled: true });

    expect(button('Supprimer')).toBeDisabled();
  });
});
