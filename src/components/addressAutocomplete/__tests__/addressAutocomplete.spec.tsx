import userEvent from '@testing-library/user-event';
import { customRender } from '@utils/contextProvider';
import { someSuggestions } from '@utils/fixtures/suggestions';
import { screen, waitFor } from '@utils/test-utils';
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
  test('should display an field to allow the entry of an address', async () => {
    // Given
    const addressToEnter = 'some address';
    // When
    RenderAutocompleteWith(suggestionServiceMock);
    // Then
    AssertAddressFieldIsRendered();
    userEvent.type(getAddressField(), addressToEnter);
    await waitFor(() => {
      expect(getAddressField()).toHaveValue(addressToEnter);
    });
  });

  describe('errors cases', () => {
    test('should display empty result when no suggestions found', async () => {
      // Given
      const addressToEnter = 'some address';
      const emptySuggestion = 'aucune adresse';
      suggestionServiceMock.fetchSuggestions.mockResolvedValue({
        features: [],
      });
      // When
      RenderAutocompleteWith(suggestionServiceMock);
      // Then
      AssertAddressFieldIsRendered();
      userEvent.type(getAddressField(), addressToEnter);
      await waitFor(() => {
        expect(getAddressField()).toHaveValue(addressToEnter);
        expect(screen.getByText(emptySuggestion)).toBeInTheDocument();
      });
    });
    test('should display empty result when some error occurs', async () => {
      // Given
      const addressToEnter = 'some address';
      const emptySuggestion = 'aucune adresse';
      suggestionServiceMock.fetchSuggestions.mockRejectedValue(new Error());
      // When
      RenderAutocompleteWith(suggestionServiceMock);
      // Then
      AssertAddressFieldIsRendered();
      userEvent.type(getAddressField(), addressToEnter);
      await waitFor(() => {
        expect(getAddressField()).toHaveValue(addressToEnter);
        expect(screen.getByText(emptySuggestion)).toBeInTheDocument();
      });
    });
  });

  describe('success cases', () => {
    test('should display a list of suggested addresses based on address user entered', async () => {
      // Given
      const addressToEnter = '90 rue ';
      // When
      RenderAutocompleteWith(suggestionServiceMock);
      // Then
      AssertAddressFieldIsRendered();
      userEvent.type(getAddressField(), addressToEnter);
      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: /90 Rue Lecourbe 75015 Paris/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', {
            name: /90 Rue Pelleport 33800 Bordeaux/i,
          })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /90 Rue Malbec 33800 Bordeaux/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /90 Rue Bonnat 31400 Toulouse/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /90 Rue Turenne 33000 Bordeaux/i })
        ).toBeInTheDocument();
      });
    });
    describe('When the user selects an option in the list of suggested addresses', () => {
      test('should display it in the address field', async () => {
        // Given
        const addressToEnter = '90 rue ';
        const optionText = '90 Rue Lecourbe 75015 Paris';
        const onSelectedCallback = jest.fn();
        // When
        RenderAutocompleteWith(suggestionServiceMock, onSelectedCallback);
        // Then
        AssertAddressFieldIsRendered();
        userEvent.type(getAddressField(), addressToEnter);
        await waitFor(() => {
          expect(
            screen.getByRole('option', { name: new RegExp(optionText, 'i') })
          ).toBeInTheDocument();
        });
        userEvent.click(selectOptionByText(optionText));
        await waitFor(() => {
          expect(getAddressField()).toHaveValue(optionText);
          expect(onSelectedCallback).toHaveBeenCalledWith(
            optionText,
            [2.304422, 48.843246],
            fakeSuggestion.features[0]
            // {
            //   geometry: { coordinates: [2.304422, 48.843246], type: 'Point' },
            //   properties: {
            //     city: 'Paris',
            //     citycode: '75115',
            //     context: '75, Paris, Île-de-France',
            //     district: 'Paris 15e Arrondissement',
            //     housenumber: '90',
            //     id: '75115_5456_00090',
            //     importance: 0.852,
            //     label: '90 Rue Lecourbe 75015 Paris',
            //     name: '90 Rue Lecourbe',
            //     postcode: '75015',
            //     score: 0.8956363636363637,
            //     street: 'Rue Lecourbe',
            //     type: 'housenumber',
            //     x: 648950.42,
            //     y: 6860580.25,
            //   },
            //   type: 'Feature',
            // }
          );
        });
      });
    });
  });
});

function getAddressField(): HTMLElement {
  return screen.getByLabelText(
    "Renseignez ci-dessous l'adresse de votre logement"
  );
}
function AssertAddressFieldIsRendered() {
  expect(getAddressField()).toBeInTheDocument();
}

function RenderAutocompleteWith(
  suggestionServiceMock: any,
  onSelectedCallback: any = jest.fn
) {
  const emptySuggestion = 'aucune adresse';
  return customRender(
    <AddressAutocomplete
      onAddressSelected={onSelectedCallback}
      placeholder={'Exemple: 5 avenue Anatole 75007 Paris'}
      label="Renseignez ci-dessous l'adresse de votre logement"
      emptySuggestionText={emptySuggestion}
    />,
    {
      overrideProps: {
        suggestionService: suggestionServiceMock,
      },
    }
  );
}
function selectOptionByText(text: string): HTMLElement {
  return screen.getByRole('option', { name: new RegExp(text, 'i') });
}

/*  test.skip('should display suggestions', async () => {
    // Given
    const handleAddressSelected = jest.fn();
    customRender(
      <AddressAutocomplete
        onAddressSelected={handleAddressSelected}
        placeholder={'Exemple: 5 avenue Anatole 75007 Paris'}
        label="Renseignez ci-dessous l'adresse de votre logement"
      />,
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
  test.skip('should display suggestions', async () => {
    // Given
    const handleAddressSelected = jest.fn();
    customRender(
      <AddressAutocomplete
        onAddressSelected={handleAddressSelected}
        placeholder={'Exemple: 5 avenue Anatole 75007 Paris'}
        label="Renseignez ci-dessous l'adresse de votre logement"
      />,
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
  });*/
