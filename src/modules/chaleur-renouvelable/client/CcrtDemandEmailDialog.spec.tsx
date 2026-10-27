import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import type { CcrtDemand, CcrtFollowUp } from '../types';
import { CcrtDemandEmailDialog } from './CcrtDemandEmailDialog';

const mocks = vi.hoisted(() => ({ followUp: vi.fn() }));
vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: { ccrt: { getFollowUp: { useQuery: mocks.followUp } } },
    users: { getPreferences: { useQuery: () => ({ data: {} }) } },
  },
}));
vi.mock('./CcrtDemandEmailForm', () => ({ CcrtDemandEmailForm: () => <p>Rédiger un message</p> }));

// The email form is mocked; the dialog only reads the applicant identity and phone.
const demand = { first_name: 'Claire', id: uuid(1), last_name: 'Gérard', phone: '' } as CcrtDemand;
const emails: CcrtFollowUp['emails'] = [2, 3].map((index) => ({
  body: `Contenu du message ${index}`,
  cc: '',
  id: uuid(index),
  object: `Projet ${index}`,
  reply_to: 'advisor@example.test',
  sent_at: '2026-10-01T10:00:00.000Z',
  signature: 'Le conseiller',
  to: 'applicant@example.test',
}));

describe('CcrtDemandEmailDialog', () => {
  it.each([undefined, uuid(3)])('opens history and expands only the selected email %s after loading', (initialEmailId) => {
    mocks.followUp.mockReturnValue({ isLoading: true });
    const props = { demand, initialEmailId, onClose: vi.fn(), onPhoneContact: vi.fn(), showHistory: true };
    const { rerender } = render(<CcrtDemandEmailDialog {...props} />);
    expect(screen.getByRole('button', { name: 'Historique des messages (0)' })).toHaveAttribute('aria-expanded', 'true');

    mocks.followUp.mockReturnValue({ data: { emails } });
    rerender(<CcrtDemandEmailDialog {...props} />);

    expect(screen.getByRole('button', { name: 'Historique des messages (2)' })).toHaveAttribute('aria-expanded', 'true');
    emails.forEach((email) => {
      expect(screen.getByRole('button', { name: `Le 1 octobre 2026 — Objet : ${email.object}` })).toHaveAttribute(
        'aria-expanded',
        String(email.id === initialEmailId)
      );
    });
  });
});
