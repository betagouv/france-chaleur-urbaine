import { render, screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { expect, test } from 'vitest';

import Home from '../pages/index';

test('Page renders successfully', () => {
  render(
    <NuqsTestingAdapter>
      <Home />
    </NuqsTestingAdapter>
  );

  expect(screen.getByRole('heading', { level: 1, name: /Le chauffage écologique, à prix maîtrisé/ })).toBeInTheDocument();
});
