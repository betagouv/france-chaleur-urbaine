import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SolutionArticleLink } from './SolutionArticleLink';

const tracking = vi.hoisted(() => ({ event: vi.fn() }));
vi.mock('@/modules/analytics/client', () => ({ trackEvent: vi.fn(), trackPostHogEvent: tracking.event }));

describe('simulator solution article links', () => {
  it('does not count an internal article opened in a new tab as an external destination', () => {
    render(<SolutionArticleLink modeId="collective-air-water-heat-pump" solutionName="PAC air/eau collective" />);
    fireEvent.click(screen.getByRole('link', { name: 'En savoir plus' }));
    expect(tracking.event).not.toHaveBeenCalledWith('nav:external_link_clicked', expect.anything());
  });

  it.each([
    ['collective-air-water-heat-pump', 'pac-air-eau-collective'],
    ['collective-heat-network', 'reseau-de-chaleur'],
    ['collective-geothermal-heat-pump', 'pac-geothermique-collective'],
    ['collective-thermodynamic-water-heater', 'chauffe-eau-thermodynamique'],
    ['individual-apartment-thermodynamic-water-heater', 'chauffe-eau-thermodynamique'],
    ['house-thermodynamic-water-heater', 'chauffe-eau-thermodynamique'],
  ] as const)('opens the validated article for %s in a new tab while preserving the current simulation', (modeId, slug) => {
    render(<SolutionArticleLink modeId={modeId} solutionName="Solution" />);
    const link = screen.getByRole('link', { name: 'En savoir plus' });
    expect(link).toHaveAttribute('href', `/ressources/${slug}`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each(['collective-solar-atmospheric-heat-pump-hot-water', 'individual-apartment-solar-atmospheric-heat-pump-hot-water'] as const)(
    'omits the link for %s without a validated article',
    (modeId) => {
      render(<SolutionArticleLink modeId={modeId} solutionName="Solution" />);
      expect(screen.queryByRole('link')).toBeNull();
    }
  );
});
