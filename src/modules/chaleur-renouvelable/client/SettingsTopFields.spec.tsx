import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SettingsTopFields } from './SettingsTopFields';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));

describe('landing address tracking', () => {
  it('sets one dwelling when selecting an individual house', () => {
    const setParams = vi.fn();
    render(
      <SettingsTopFields
        adresse={null}
        setGeoAddress={vi.fn()}
        typeLogement="immeuble_chauffage_collectif"
        espaceExterieur={null}
        setParams={setParams}
      />
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Mode de chauffage' }), { target: { value: 'maison_individuelle' } });
    expect(setParams).toHaveBeenCalledExactlyOnceWith({ espaceExterieur: 'none', nbLogements: 1, typeLogement: 'maison_individuelle' });
  });

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
