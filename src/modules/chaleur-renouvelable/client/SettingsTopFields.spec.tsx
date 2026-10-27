import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SettingsTopFields } from './SettingsTopFields';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));

describe('landing address tracking', () => {
  it.each([null, 'Adresse déjà renseignée'])('tracks the first input once with initial address %s', (adresse) => {
    render(<SettingsTopFields adresse={adresse} setGeoAddress={vi.fn()} typeLogement={null} espaceExterieur={null} setParams={vi.fn()} />);
    const addressInput = screen.getByRole('combobox', { name: 'Adresse' });
    fireEvent.focus(addressInput);
    expect(mocks.track).not.toHaveBeenCalled();
    fireEvent.input(addressInput, { target: { value: 'a' } });
    expect(mocks.track).toHaveBeenCalledExactlyOnceWith('fcr_landing:address_typed');

    fireEvent.input(addressInput, { target: { value: 'ab' } });
    fireEvent.input(addressInput, { target: { value: '' } });
    fireEvent.input(addressInput, { target: { value: 'b' } });
    expect(mocks.track).toHaveBeenCalledTimes(1);
  });
});
