import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { classifyDemandOrigin } from '../demand-origin';
import { DemandOriginCell } from './DemandOriginCell';

describe('admin origin column', () => {
  it.each([
    [{ campaign: 'automne', medium: 'cpc', source: 'google' }, 'Publicité', 'Google Ads · automne'],
    [{ campaign: null, integrationId: 'partner', medium: null, source: null }, 'Intégration partenaire', 'Hellio'],
  ] as const)('keeps details in the popover for %s', async (acquisition, label, detail) => {
    render(<DemandOriginCell origin={classifyDemandOrigin(acquisition, { partner: 'Hellio' })} />);
    const button = screen.getByRole('button', { name: `Origine : ${label}. Voir les détails` });
    expect(button.textContent).toStrictEqual(label);
    expect(screen.queryByText(detail)).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(await screen.findByText(detail)).toBeInTheDocument();
    if (acquisition.campaign) {
      expect(screen.getByText(acquisition.campaign)).toBeInTheDocument();
    }
  });
});
