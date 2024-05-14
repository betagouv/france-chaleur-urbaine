import { useCallback, useEffect, useState } from 'react';
import useInitialSearchParam from './useInitialSearchParam';

const LOCAL_STORAGE_KEY_PREFIX = '__FCU:App__-';

/**
 * Hook that retrieves a value from an URL param or fallbacks to using local storage.
 * It handles the storage of the value in the local storage but does not update the URL.
 */
export default function useURLParamOrLocalStorage<T>(
  urlKey: string,
  localStorageKey: string,
  defaultValue: T,
  parseValue: (value: string) => T
): [T | null, (value: T) => void] {
  const initialURLValue = useInitialSearchParam(urlKey);

  const [paramValue, internalSetParamValue] = useState<T | null>(
    initialURLValue ? parseValue(initialURLValue) : null
  );

  const setParamValue = useCallback((value: T) => {
    internalSetParamValue(value);
    window.localStorage.setItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${localStorageKey}`,
      JSON.stringify(value)
    );
  }, []);

  // set the initial value (after a possible null) and synchronize URL and local storage values
  useEffect(() => {
    const localStorageValue = localStorage.getItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${localStorageKey}`
    );

    if (initialURLValue) {
      setParamValue(parseValue(initialURLValue));
    } else if (localStorageValue) {
      setParamValue(parseValue(localStorageValue));
    } else {
      setParamValue(defaultValue);
    }
  }, []);

  return [paramValue, setParamValue];
}

export function parseAsBoolean(value: string): boolean {
  return value === 'true';
}

export function parseAsString(value: string): string {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
