import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION } from '../constants';
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
    expect(screen.getByRole('button', { name: 'Enregistrer le suivi' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'À traiter' })).toHaveValue('A traiter');
    expect(screen.getByText('Note')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?'), {
      target: { value: 'Premier conseil téléphonique réalisé' },
    });
    if (note) {
      fireEvent.change(screen.getByRole('textbox', { name: /Ajouter une note/ }), { target: { value: note } });
    }
    fireEvent.click(screen.getByRole('button', { name: note ? 'Ajouter au suivi' : 'Enregistrer le suivi' }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledExactlyOnceWith({
        status: 'Premier conseil téléphonique réalisé',
        ...(note && { note }),
      })
    );
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue(''));
  });

  it.each(['A traiter', DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION] as const)(
    'adds a drafted note without overwriting a concurrent status change from %s',
    async (status) => {
      const props = { isUpdating: false, onSaved: vi.fn(), onUpdate: vi.fn().mockResolvedValue(undefined) };
      const { rerender } = render(<CcrtFollowUpForm {...props} demand={{ project_state: 'En réflexion', status }} />);
      fireEvent.change(screen.getByRole('textbox', { name: /Ajouter une note/ }), { target: { value: 'Note en cours' } });
      rerender(<CcrtFollowUpForm {...props} demand={{ project_state: 'En réflexion', status: 'Recontacté pour premier échange' }} />);

      expect(screen.getByRole('textbox', { name: /Ajouter une note/ })).toHaveValue('Note en cours');
      fireEvent.click(screen.getByRole('button', { name: 'Ajouter au suivi' }));

      await waitFor(() => expect(props.onUpdate).toHaveBeenCalledExactlyOnceWith({ note: 'Note en cours' }));
      await waitFor(() =>
        expect(screen.getByLabelText('Où en êtes-vous du suivi de la demande ?')).toHaveValue('Recontacté pour premier échange')
      );
    }
  );

  it('submits only the project state when the validation status is unchanged', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <CcrtFollowUpForm
        demand={{ project_state: 'En réflexion', status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION }}
        isUpdating={false}
        onUpdate={onUpdate}
        onSaved={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('État du projet'), { target: { value: 'Installation ENR votée en AG' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le suivi' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledExactlyOnceWith({ projectState: 'Installation ENR votée en AG' }));
  });
});
