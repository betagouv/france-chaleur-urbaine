import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import type { CcrtFollowUp } from '../types';
import { CcrtDemandHistory } from './CcrtDemandHistory';

describe('CcrtDemandHistory', () => {
  it.each([
    { from: null, to: '' },
    { from: '', to: null },
    { from: null, to: null },
    { from: '   ', to: null },
  ])('hides equivalent missing values ($from → $to) while keeping real changes', (emptyChange) => {
    const followUp: CcrtFollowUp = {
      emails: [],
      history: [
        {
          created_at: '2026-10-01T10:00:00.000Z',
          data: {
            changes: {
              average_residents: { from: 0, to: 2 },
              is_public_advisor_selected: { from: false, to: true },
              refusal_period: emptyChange,
              refusal_reason: emptyChange,
              surface_area: { from: null, to: 145 },
            },
          },
          email: null,
          first_name: null,
          id: uuid(1),
          last_name: null,
          type: 'ccrt_demand_updated',
        },
      ],
      notes: [],
      total: 1,
      users: [],
    };

    render(<CcrtDemandHistory followUp={followUp} offset={0} onPageChange={vi.fn()} />);

    expect(screen.getByText('Surface totale (m²) : Non renseigné → 145')).toBeInTheDocument();
    expect(screen.getByText('Habitants moyens : 0 → 2')).toBeInTheDocument();
    expect(screen.getByText('Refus de raccordement : Non → Oui')).toBeInTheDocument();
    expect(screen.queryByText(/Période du refus|Motif du refus/)).toBeNull();
  });

  it('hides a historical event when none of its fields has a visible change', () => {
    const followUp: CcrtFollowUp = {
      emails: [],
      history: [
        {
          created_at: '2026-10-01T10:00:00.000Z',
          data: { changes: { refusal_period: { from: null, to: '' }, refusal_reason: { from: '', to: null } } },
          email: null,
          first_name: null,
          id: uuid(1),
          last_name: null,
          type: 'ccrt_demand_updated',
        },
      ],
      notes: [],
      total: 1,
      users: [],
    };

    render(<CcrtDemandHistory followUp={followUp} offset={0} onPageChange={vi.fn()} />);

    expect(screen.queryByRole('heading', { name: 'Information du bâtiment modifiée' })).toBeNull();
    expect(screen.getByText('Aucune action enregistrée.')).toBeInTheDocument();
  });

  it('displays notes as read-only entries with the author and date without the time', () => {
    const createdAt = '2026-10-01T10:00:00.000Z';
    const author = { email: 'advisor@example.test', first_name: 'Claire', last_name: 'Gérard' };
    const followUp: CcrtFollowUp = {
      emails: [],
      history: [{ ...author, created_at: createdAt, data: { noteId: uuid(2) }, id: uuid(1), type: 'ccrt_demand_note_created' }],
      notes: [
        { ...author, body: 'Premier échange réalisé avec le conseil syndical.', created_at: createdAt, id: uuid(2), updated_at: createdAt },
      ],
      total: 1,
      users: [],
    };

    render(<CcrtDemandHistory followUp={followUp} offset={0} onPageChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Note interne' })).toBeInTheDocument();
    expect(screen.getByText(followUp.notes[0].body)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Modifier|Supprimer/ })).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('1 octobre 2026').closest('p')).toHaveTextContent('Claire Gérard · le 1 octobre 2026');
    expect(screen.getByText('1 octobre 2026')).toHaveAttribute('datetime', createdAt);
    expect(screen.queryByText(/10:00/)).toBeNull();
  });
});
