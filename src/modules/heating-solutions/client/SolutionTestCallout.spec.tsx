import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SolutionTestCallout } from './SolutionTestCallout';

describe('article simulator invitation', () => {
  it('takes the reader to the requested FCR landing page', () => {
    render(<SolutionTestCallout />);
    expect(screen.getByRole('link', { name: /Faire le test/ })).toHaveAttribute('href', '/chaleur-renouvelable');
  });
});
