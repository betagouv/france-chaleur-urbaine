import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SolutionArticleLink } from './SolutionArticleLink';

describe('simulator solution article links', () => {
  it('opens the validated article in a new tab while preserving the current simulation', () => {
    render(<SolutionArticleLink modeId="collective-air-water-heat-pump" solutionName="PAC air/eau" />);
    const link = screen.getByRole('link', { name: /En savoir plus sur cette solution/ });
    expect(link).toHaveAttribute('href', '/ressources/pac-air-eau-collective');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each(['collective-heat-network', 'collective-geothermal-heat-pump', 'house-thermodynamic-water-heater'] as const)(
    'omits the link for %s without a validated article',
    (modeId) => {
      render(<SolutionArticleLink modeId={modeId} solutionName="Solution" />);
      expect(screen.queryByRole('link')).toBeNull();
    }
  );
});
