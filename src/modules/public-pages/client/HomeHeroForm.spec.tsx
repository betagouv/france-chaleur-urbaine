import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import type { BANAddressFeature } from '@/modules/ban/types';

import { HomeHeroForm } from './HomeHeroForm';

const errorMessage = 'Une adresse précise est nécessaire pour identifier votre bâtiment et proposer des solutions pertinentes';
const street: BANAddressFeature = {
  geometry: { coordinates: [2, 44], type: 'Point' },
  properties: {
    city: 'Figeac',
    citycode: '46102',
    context: '46, Lot, Occitanie',
    housenumber: '',
    id: '46102_street',
    importance: 0.5,
    label: 'chemin des Crêtes 46100 Figeac',
    name: 'chemin des Crêtes',
    postcode: '46100',
    score: 1,
    street: 'chemin des Crêtes',
    type: 'street',
    x: 0,
    y: 0,
  },
  type: 'Feature',
};
const address: BANAddressFeature = {
  ...street,
  properties: { ...street.properties, housenumber: '14', label: '14 chemin des Crêtes 46100 Figeac', type: 'housenumber' },
};

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@react-hookz/web', () => ({ useResizeObserver: () => {} }));
vi.mock('@/modules/app/client/hooks/useUserInfo', () => ({ default: () => ({ setUserInfo: vi.fn(), userInfo: {} }) }));
vi.mock('./hooks/useEligibilityTest', () => ({ useEligibilityTest: () => ({ isLoading: false, testEligibility: vi.fn() }) }));
vi.mock('./hooks/useRestoreGeoAddress', () => ({ useRestoreGeoAddress: () => {} }));
vi.mock('./hooks/useHomeFormInitialValues', () => ({
  useHomeFormInitialValues: () => ({
    defaultValues: { espaceExterieur: 'none', geoAddress: undefined, typeLogement: '', typeRadiateur: '' },
  }),
}));
vi.mock('./EligibilityContactModal', () => ({ EligibilityContactModal: () => null }));
vi.mock('@/modules/analytics/client', () => ({ AnalyticsFormId: { form_test_adresse: 'test-address' }, trackPostHogEvent: vi.fn() }));
vi.mock('@/modules/ban/client', () => ({
  BAN_MIN_QUERY_LENGTH: 3,
  searchBANAddresses: async ({ query }: { query: string }) => (query.startsWith('14') ? [address] : [street]),
}));

const selectAddress = async (label: string) => {
  const input = screen.getByRole('combobox', { name: 'Mon bâtiment est au' });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: label } });
  fireEvent.click(await screen.findByRole('option', { name: label }));
  return input;
};

describe('home comparator address validation', () => {
  it('shows the address error when switching to the comparator after selecting a street, and clears it in eligibility mode', async () => {
    render(
      <NuqsTestingAdapter hasMemory>
        <HomeHeroForm />
      </NuqsTestingAdapter>
    );
    const input = await selectAddress(street.properties.label);
    expect(screen.queryByText(errorMessage)).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: /Comparer toutes les solutions/ }));
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(input).toHaveClass('fr-input--error');

    fireEvent.click(screen.getByRole('radio', { name: /Savoir si je peux me raccorder/ }));
    await waitFor(() => expect(screen.queryByText(errorMessage)).toBeNull());
    expect(input).not.toHaveClass('fr-input--error');
  });

  it('shows the error on street selection in comparator mode and clears it when a precise address is selected', async () => {
    render(
      <NuqsTestingAdapter hasMemory searchParams="?mode=comparateur">
        <HomeHeroForm />
      </NuqsTestingAdapter>
    );
    const input = await selectAddress(street.properties.label);
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(input).toHaveClass('fr-input--error');

    await selectAddress(address.properties.label);
    await waitFor(() => expect(screen.queryByText(errorMessage)).toBeNull());
    expect(input).not.toHaveClass('fr-input--error');
  });
});
