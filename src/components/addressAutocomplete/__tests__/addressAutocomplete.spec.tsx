import userEvent from '@testing-library/user-event';
import { customRender } from '@utils/contextProvider';
import { someSuggestions } from '@utils/fixtures/suggestions';
import { screen, waitFor } from '@utils/test-utils';
import React from 'react';
import AddressAutocomplete from '../AddressAutocomplete';

describe('Address autocomplete', () => {
  const fakeSuggestion = someSuggestions();
  const suggestionServiceMock = {
    fetchSuggestions: jest.fn(),
  };

  beforeEach(() => {
    suggestionServiceMock.fetchSuggestions.mockResolvedValue(fakeSuggestion);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  test('should be correctly rendered', () => {
    // When
    customRender(<AddressAutocomplete onAddressSelected={jest.fn} />, {});
    // Then
    expect(
      screen.getByRole('combobox', { name: /address/i })
    ).toBeInTheDocument();
  });

  test('should display suggestions', async () => {
    // Given
    const handleAddressSelected = jest.fn();
    customRender(
      <AddressAutocomplete onAddressSelected={handleAddressSelected} />,
      {
        overrideProps: {
          suggestionService: suggestionServiceMock,
        },
      }
    );
    // When
    userEvent.type(
      screen.getByRole('combobox', { name: /address/i }),
      'rue de ségur'
    );
    // Then
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    userEvent.click(
      screen.getByRole('option', { name: /90 Rue Lecourbe 75015 Paris/i })
    );

    expect(handleAddressSelected).toHaveBeenCalledWith(
      '90 Rue Lecourbe 75015 Paris',
      [2.304422, 48.843246]
    );
  });
});
