import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import type { CcrtFollowUp } from '../types';
import { CcrtDemandHistory } from './CcrtDemandHistory';

describe('CcrtDemandHistory', () => {
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
