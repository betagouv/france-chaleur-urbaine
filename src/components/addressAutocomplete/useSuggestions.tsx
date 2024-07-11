import { useIsMounted } from '@react-hookz/web';
import debounce from '@utils/debounce';
import { useState } from 'react';
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
  debounceTime = 300,
  minCharactersLength = 3,
}: configProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [status, setStatus] = useState<ValueOf<Status>>(Status.Idle);
  const isMounted = useIsMounted();
  const DIGITS_THRESHOLD = 3;
  const { suggestionService } = useServices();
  const debounceFetch = debounce(async (query: string) => {
    try {
      const searchTerm = query.trim();
      if (!searchTerm || !isMounted || searchTerm.length <= DIGITS_THRESHOLD) {
        return;
      }
      setStatus(Status.Loading);
      const fetchedSuggestions = await suggestionService.fetchSuggestions(
        searchTerm,
        {
          limit: limit.toString(),
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

  return {
    suggestions,
    status,
    fetchSuggestions,
  };
};

export default useSuggestions;
