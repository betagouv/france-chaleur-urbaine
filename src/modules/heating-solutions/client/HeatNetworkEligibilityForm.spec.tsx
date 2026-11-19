import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BANAddressFeature } from '@/modules/ban/types';

import { HeatNetworkEligibilityForm } from './HeatNetworkEligibilityForm';

const eligibilityTest = vi.hoisted(() => ({ hasError: false, isLoading: false, testEligibility: vi.fn() }));
const address: BANAddressFeature = {
  geometry: { coordinates: [2, 44], type: 'Point' },
  properties: {
    city: 'Figeac',
    citycode: '46102',
    context: '46, Lot, Occitanie',
    housenumber: '14',
    id: '46102_14',
    importance: 0.5,
    label: '14 chemin des Crêtes 46100 Figeac',
    name: '14 chemin des Crêtes',
    postcode: '46100',
    score: 1,
    street: 'chemin des Crêtes',
    type: 'housenumber',
    x: 0,
    y: 0,
  },
  type: 'Feature',
};

vi.mock('@/modules/public-pages/client/hooks/useEligibilityTest', () => ({ useEligibilityTest: () => eligibilityTest }));
vi.mock('@/modules/public-pages/client/EligibilityContactModal', () => ({ EligibilityContactModal: () => null }));
vi.mock('@/modules/analytics/client', () => ({ AnalyticsFormId: { form_test_adresse: 'test-address' } }));
vi.mock('@/modules/ban/client', () => ({ BAN_MIN_QUERY_LENGTH: 3, searchBANAddresses: async () => [address] }));

describe('heat-network article address test', () => {
  beforeEach(() => {
    eligibilityTest.testEligibility.mockReset();
    eligibilityTest.hasError = false;
  });

  it('requires a heating type and an address selected from the suggestions', async () => {
    render(<HeatNetworkEligibilityForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Tester mon adresse' }));
    expect(await screen.findByText("N'oubliez pas d'indiquer votre type de chauffage.")).toBeInTheDocument();
    expect(await screen.findByText("N'oubliez pas de sélectionner votre adresse dans la liste.")).toBeInTheDocument();
    expect(eligibilityTest.testEligibility).not.toHaveBeenCalled();
  });

  it.each(['collectif', 'individuel'])('tests the selected address with %s heating', async (heatingType) => {
    render(<HeatNetworkEligibilityForm />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Mode de chauffage actuel' }), { target: { value: heatingType } });
    const input = screen.getByRole('combobox', { name: 'Adresse du bâtiment' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: address.properties.label } });
    fireEvent.click(await screen.findByRole('option', { name: address.properties.label }));
    fireEvent.click(screen.getByRole('button', { name: 'Tester mon adresse' }));
    await waitFor(() => expect(eligibilityTest.testEligibility).toHaveBeenCalledExactlyOnceWith(address, heatingType));
  });

  it('shows a recoverable error when the eligibility service fails', () => {
    eligibilityTest.hasError = true;
    render(<HeatNetworkEligibilityForm />);
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue. Veuillez réessayer');
    expect(screen.getByRole('link', { name: 'contacter le support' })).toHaveAttribute('href', '/contact');
  });
});
