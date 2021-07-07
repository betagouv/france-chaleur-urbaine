import { FakeHttpClient } from '@utils/fakeHttpClient';
import { ServiceError } from '../errors';
import { SuggestionService } from '../suggestionService';

describe('Suggestion service', () => {
  const baseURL = process.env.NEXT_PUBLIC_BAN_API_BASE_URL;
  afterEach(() => {
    jest.resetAllMocks();
  });
  test('should correctly fetch suggestion with provided params', () => {
    // Given
    const searchTerm = 'some term';
    const additionalParams = { limit: '10', autocomplete: '1' };
    const expectedUrl = `${baseURL}?${formatQueryParams({
      q: searchTerm,
      limit: '10',
      autocomplete: '1',
    })}`;
    const service = new SuggestionService(FakeHttpClient);
    // When
    service.fetchSuggestions(searchTerm, additionalParams);
    // Then
    expect(FakeHttpClient.get).toHaveBeenNthCalledWith(1, expectedUrl);
  });
  test('should throw an error when fetching fails', async () => {
    // Given
    const searchTerm = 'some term';
    const expectedUrl = `${baseURL}?${formatQueryParams({
      q: searchTerm,
    })}`;

    const service = new SuggestionService(FakeHttpClient);
    FakeHttpClient.get.mockRejectedValue({});
    try {
      // When
      await service.fetchSuggestions(searchTerm);
    } catch (error) {
      // Then
      expect(FakeHttpClient.get).toHaveBeenNthCalledWith(1, expectedUrl);
      expect(error).rejects;
      expect(error).toBeInstanceOf(ServiceError);
    }
  });
});

const formatQueryParams = (params: Record<string, string>) =>
  new URLSearchParams(params).toString();
