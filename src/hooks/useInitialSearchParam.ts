import { useSearchParams } from 'next/navigation';

/**
 * Returns the value of a search param.
 * Works with SSR too.
 */
export default function useInitialSearchParam(key: string) {
  // Not reactive, but available on the server and on page load
  const initialSearchParams = useSearchParams();
  return (
    (typeof location !== 'object'
      ? // SSR
        initialSearchParams.get(key)
      : // Components mounted after page load must use the current URL value
        new URLSearchParams(location.search).get(key)) ?? null
  );
}
