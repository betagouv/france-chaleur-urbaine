import { act } from '@testing-library/react-hooks';
import { customRenderHook } from '@utils/contextProvider';
import { someSuggestions } from '@utils/fixtures/suggestions';
import useSuggestions from '../useSuggestions';

describe('useBan Hook', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  test('should correctly fetch suggestions', async () => {
    // Given
    const term = 'some address';
    const fakeSuggestion = someSuggestions();
    const suggestionServiceMock = {
      fetchSuggestions: jest.fn().mockResolvedValue(fakeSuggestion),
    };
    const { result, waitForNextUpdate } = customRenderHook(
      () =>
        useSuggestions({
          debounceTime: 0,
          limit: 1,
          autocomplete: false,
        }),
      {
        suggestionService: suggestionServiceMock,
      }
    );
    // When
    act(() => {
      result.current.fetchSuggestions(term);
    });
    // Then
    await waitForNextUpdate();
    expect(result.current.suggestions).toEqual(fakeSuggestion.features);
    expect(result.current.status).toEqual('success');
  });

  test('should throw an error when fetching fails', async () => {
    // Given
    const term = 'some address';
    const suggestionServiceMock = {
      fetchSuggestions: jest.fn().mockRejectedValue({}),
    };
    const { result, waitForNextUpdate } = customRenderHook(
      () =>
        useSuggestions({
          debounceTime: 0,
          limit: 1,
          autocomplete: false,
        }),
      {
        suggestionService: suggestionServiceMock,
      }
    );
    // When
    act(() => {
      result.current.fetchSuggestions(term);
    });
    // Then
    await waitForNextUpdate();
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.status).toEqual('error');
  });
});
