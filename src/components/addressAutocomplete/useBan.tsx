import debounce from 'lodash.debounce';
import React from 'react';
import { useServices } from 'src/services';
import { Suggestions } from 'src/types';

type configProps = {
  limit: number;
  autocomplete: boolean;
  debounceTime: number;
};

const useBan = (
  term: string,
  { limit, autocomplete, debounceTime }: configProps = {
    limit: 5,
    autocomplete: false,
    debounceTime: 300,
  }
) => {
  const [suggestions, setSuggestions] = React.useState<Suggestions | []>([]);
  const [status, setStatus] = React.useState('idle');
  const DIGITS_THRESHOLD = 3;
  const { suggestionService } = useServices();
  const searchTerm = term.trim();
  const debounceFetch = React.useCallback(
    debounce(async (query: string) => {
      setStatus('loading');
      try {
        const fetchedSuggestions = await suggestionService.fetchSuggestions(
          query,
          { limit: limit.toString(), autocomplete: autocomplete.toString() }
        );

        setSuggestions(fetchedSuggestions.features);
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    }, debounceTime),

    []
  );
  React.useEffect(() => {
    if (!searchTerm || searchTerm.length <= DIGITS_THRESHOLD) return;

    debounceFetch(searchTerm);
  }, [suggestionService, searchTerm, debounceFetch]);
  return {
    suggestions,
    displaySuggestions: status !== 'idle' && !!suggestions,
    status,
  };
};

export default useBan;
