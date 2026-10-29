import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { zAdminUpdateDemandeChaleurRenouvelableInput, zCcrtUpdateDemandeChaleurRenouvelableInput } from '../constants';
import { CcrtFollowUpForm } from './CcrtFollowUpForm';

describe('CcrtFollowUpForm', () => {
  it.each([zAdminUpdateDemandeChaleurRenouvelableInput, zCcrtUpdateDemandeChaleurRenouvelableInput])(
    'rejects the retired closed status in update inputs',
    (schema) => {
      expect(schema.safeParse({ demandId: 'demand', values: { status: 'Clôturée' } }).success).toStrictEqual(false);
      expect(schema.safeParse({ demandId: 'demand', values: { status: 'Installation réalisée' } }).success).toStrictEqual(true);
    }
  );

  it('autosaves the status without submitting or clearing a drafted note', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onSaved = vi.fn();
    render(<CcrtFollowUpForm demand={{ status: 'A traiter' }} isUpdating={false} onUpdate={onUpdate} onSaved={onSaved} />);
    expect(screen.getByRole('button', { name: 'Ajouter au suivi' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'À traiter' })).toHaveValue('A traiter');
    fireEvent.change(screen.getByRole('textbox', { name: /Ajouter une note/ }), { target: { value: 'Conseil donné' } });
    fireEvent.change(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?'), {
      target: { value: 'Installation réalisée' },
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith({ status: 'Installation réalisée' });
    expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue('Conseil donné');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter au suivi' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
    expect(onUpdate.mock.calls).toStrictEqual([[{ status: 'Installation réalisée' }], [{ note: 'Conseil donné' }]]);
    expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue('');
  });

  it.each(['A traiter'] as const)(
    'preserves a drafted note and refreshes the saved status after a concurrent change from %s',
    async (status) => {
      const props = { isUpdating: false, onSaved: vi.fn(), onUpdate: vi.fn().mockResolvedValue(undefined) };
      const { rerender } = render(<CcrtFollowUpForm {...props} demand={{ status }} />);
      fireEvent.change(screen.getByRole('textbox', { name: /Ajouter une note/ }), { target: { value: 'Note en cours' } });
      rerender(<CcrtFollowUpForm {...props} demand={{ status: 'Recontacté pour premier échange' }} />);

      expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue('Note en cours');
      expect(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?')).toHaveValue('Recontacté pour premier échange');
      expect(props.onUpdate).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Ajouter au suivi' }));

      await waitFor(() => expect(props.onUpdate).toHaveBeenCalledExactlyOnceWith({ note: 'Note en cours' }));
    }
  );

  it('locks follow-up actions until the automatic save finishes', async () => {
    let finishSave = () => {};
    const onUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
    );
    render(<CcrtFollowUpForm demand={{ status: 'A traiter' }} isUpdating={false} onUpdate={onUpdate} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?'), {
      target: { value: 'Recontacté pour premier échange' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('Enregistrement du suivi…');
    expect(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ajouter au suivi' })).toBeDisabled();
    await act(async () => finishSave());
    expect(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?')).toBeEnabled();
  });

  it('restores the persisted status on failure and preserves the note for retry', async () => {
    const onSaved = vi.fn();
    const onUpdate = vi.fn().mockRejectedValueOnce(new Error('Échec de l’enregistrement')).mockResolvedValue(undefined);
    render(<CcrtFollowUpForm demand={{ status: 'A traiter' }} isUpdating={false} onUpdate={onUpdate} onSaved={onSaved} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Ajouter une note/ }), { target: { value: 'Note en cours' } });
    fireEvent.change(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?'), {
      target: { value: 'Recontacté pour premier échange' },
    });

    await waitFor(() => expect(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?')).toHaveValue('A traiter'));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue('Note en cours');
    fireEvent.change(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?'), {
      target: { value: 'Recontacté pour premier échange' },
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });
});
