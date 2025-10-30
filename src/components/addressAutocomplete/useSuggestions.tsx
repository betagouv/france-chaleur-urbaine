import { useIsMounted } from '@react-hookz/web';
import { useState } from 'react';
import { searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';
import debounce from '@/utils/debounce';

enum Status {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}
type ValueOf<Obj> = Obj[keyof Obj];
type UseSuggestionsProps = {
  limit?: number;
  autocomplete?: boolean;
  debounceTime?: number;
  minCharactersLength?: number;
  excludeCities?: boolean;
};

const useSuggestions = ({ limit = 5, debounceTime = 300, minCharactersLength = 3, excludeCities }: UseSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [status, setStatus] = useState<ValueOf<Status>>(Status.Idle);
  const isMounted = useIsMounted();
  const DIGITS_THRESHOLD = 3;
  const debounceFetch = debounce(async (query: string) => {
    try {
      const searchTerm = query.trim();
      if (!searchTerm || !isMounted || searchTerm.length <= DIGITS_THRESHOLD) {
        return;
      }
      setStatus(Status.Loading);
      const features = await searchBANAddresses({ excludeCities, limit, query: searchTerm });
      setSuggestions(features);
      setStatus(Status.Success);
    } catch (e) {
      setStatus(Status.Error);
      console.error({
        error: e,
      });
    }
  }, debounceTime);
  const fetchSuggestions = (queryString: string) => queryString.length >= minCharactersLength && debounceFetch(queryString);

  return {
    fetchSuggestions,
    status,
    suggestions,
  };
};

export default useSuggestions;
