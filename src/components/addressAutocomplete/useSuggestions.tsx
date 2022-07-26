import debounce from 'lodash.debounce';
import { useEffect, useRef, useState } from 'react';
import { useServices } from 'src/services';
import { SuggestionItem } from 'src/types/Suggestions';

enum Status {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}
type ValueOf<Obj> = Obj[keyof Obj];
type configProps = {
  limit?: number;
  autocomplete?: boolean;
  debounceTime?: number;
  minCharactersLength?: number;
};

const useSuggestions = ({
  limit = 5,
  autocomplete = false,
  debounceTime = 300,
  minCharactersLength = 3,
}: configProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [status, setStatus] = useState<ValueOf<Status>>(Status.Idle);
  const mountedRef = useRef(true);
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
      console.error({
        error: e,
      });
    }
  }, debounceTime);
  const fetchSuggestions = (queryString: string) =>
    queryString.length >= minCharactersLength && debounceFetch(queryString);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return {
    suggestions,
    status,
    fetchSuggestions,
  };
};

export default useSuggestions;
