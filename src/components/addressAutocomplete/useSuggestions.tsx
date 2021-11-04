import { Status, ValueOf } from '@components/addressAutocomplete/utils';
import debounce from 'lodash.debounce';
import React from 'react';
import { useServices } from 'src/services';
import { Suggestions } from 'src/types';

type configProps = {
  limit: number;
  autocomplete: boolean;
  debounceTime: number;
};

const useSuggestions = (
  { limit, autocomplete, debounceTime }: configProps = {
    limit: 5,
    autocomplete: false,
    debounceTime: 300,
  }
) => {
  const [suggestions, setSuggestions] = React.useState<Suggestions | []>([]);
  const [status, setStatus] = React.useState<ValueOf<Status>>(Status.Idle);
  const mountedRef = React.useRef(true);
  const DIGITS_THRESHOLD = 3;
  const { suggestionService } = useServices();
  const debounceFetch = debounce(async (query: string) => {
    try {
      const searchTerm = query.trim();
      if (
        !searchTerm ||
        !mountedRef.current ||
        searchTerm.length <= DIGITS_THRESHOLD
      ) {
        return;
      }
      setStatus(Status.Loading);
      const fetchedSuggestions = await suggestionService.fetchSuggestions(
        searchTerm,
        {
          limit: limit.toString(),
          autocomplete: autocomplete.toString(),
        }
      );

      setSuggestions(fetchedSuggestions.features);
      setStatus(Status.Success);
    } catch (e) {
      setStatus(Status.Error);
      // eslint-disable-next-line no-console
      console.log({
        error: e,
      });
    }
  }, debounceTime);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return {
    suggestions,
    status,
    fetchSuggestions: debounceFetch,
  };
};

export default useSuggestions;
