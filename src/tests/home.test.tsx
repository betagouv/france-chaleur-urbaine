import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import Home from '../pages/index';

test('Page renders successfully', () => {
  render(<Home />);

  expect(screen.getByRole('heading', { level: 1, name: /Le chauffage urbain.*une solution écologique à prix maîtrisé/ })).toBeDefined();
});
