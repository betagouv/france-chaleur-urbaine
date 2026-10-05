import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type DemandSubmissionResult, demandStatusDefault } from '@/modules/demands/constants';

import DemandSubmittedPanel from './DemandSubmittedPanel';

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/modules/auth/client/hooks', () => ({
  useAuthentication: () => ({
    isAuthenticated: false,
  }),
}));

const submissionResult = {
  address: '2 Rue Bara 69003 Lyon',
  createdAt: '2026-09-30T10:00:00.000Z',
  distance: null,
  email: 'test@example.com',
  id: 'demand-1',
  isEligible: false,
  isExisting: false,
  networkName: null,
  status: demandStatusDefault,
} satisfies DemandSubmissionResult;

describe('DemandSubmittedPanel', () => {
  it('shows the confirmation email notice by default', () => {
    render(<DemandSubmittedPanel submissionResult={submissionResult} />);

    expect(screen.getByText(/Un e-mail de confirmation vient de vous être envoyé/)).toBeInTheDocument();
  });

  it('hides the confirmation email notice when no email is sent', () => {
    render(<DemandSubmittedPanel showEmailNotice={false} submissionResult={submissionResult} />);

    expect(screen.queryByText(/Un e-mail de confirmation vient de vous être envoyé/)).not.toBeInTheDocument();
  });

  it('hides heat-network actions for renewable advisor confirmations', () => {
    render(
      <DemandSubmittedPanel nextStepsContext="renewable-advisor" showHeatNetworkActions={false} submissionResult={submissionResult} />
    );

    expect(screen.getByText(/Votre demande est transmise à votre conseiller·ère chaleur renouvelable/)).toBeInTheDocument();
    expect(screen.queryByText('Accéder à mon espace personnel')).not.toBeInTheDocument();
    expect(screen.queryByText('Téléchargez notre guide pratique du raccordement')).not.toBeInTheDocument();
  });
});
