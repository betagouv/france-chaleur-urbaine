import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SolutionArticleLink } from './SolutionArticleLink';

describe('simulator solution article links', () => {
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
