import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CcrtFollowUpForm } from './CcrtFollowUpForm';

describe('CcrtFollowUpForm', () => {
  it.each(['Conseil donné', ''])('saves the selected status and optional note "%s" with Ajouter au suivi', async (note) => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <CcrtFollowUpForm
        demand={{ project_state: 'En réflexion', status: 'A traiter' }}
        isUpdating={false}
        onUpdate={onUpdate}
        onSaved={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: 'Enregistrer le suivi' })).toBeNull();
    expect(screen.getByText('Note')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?'), {
      target: { value: 'Premier conseil téléphonique réalisé' },
    });
    if (note) {
      fireEvent.change(screen.getByRole('textbox', { name: /Ajouter une note/ }), { target: { value: note } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter au suivi' }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledExactlyOnceWith({
        status: 'Premier conseil téléphonique réalisé',
        ...(note && { note }),
      })
    );
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue(''));
  });

  it('keeps a note draft when the demand status refreshes', () => {
    const props = { isUpdating: false, onSaved: vi.fn(), onUpdate: vi.fn() };
    const { rerender } = render(<CcrtFollowUpForm {...props} demand={{ project_state: 'En réflexion', status: 'A traiter' }} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Ajouter une note/ }), { target: { value: 'Note en cours' } });
    rerender(<CcrtFollowUpForm {...props} demand={{ project_state: 'En réflexion', status: 'Recontacté pour premier échange' }} />);

    expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue('Note en cours');
  });
});
