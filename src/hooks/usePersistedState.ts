import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { STORED_KEY } from './useLocalStorage';

type PersistedStateOption = {
  beforeStorage?: (arg: any) => void;
  keyPrefix?: string;
};

/**
 * Use useLocalStorage instead as this one generates errors
 * @deprecated
 */
function usePersistedState<T>(
  name: string,
  defaultValue: T,
  { beforeStorage = () => undefined, keyPrefix = STORED_KEY }: PersistedStateOption = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState(defaultValue);
  const key = useMemo(() => `${keyPrefix}-${name}`, [keyPrefix, name]);
  const nameRef = useRef(key);

  const saveInStorage = useCallback(
    (key: string, value: any) => {
      if (typeof window === 'undefined') return;
      return window.localStorage.setItem(key, JSON.stringify(beforeStorage(value)));
    },
    [beforeStorage]
  );

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue !== null) setValue(JSON.parse(storedValue));
    } catch (err) {
      console.error(err);
    }
  }, [key]);

  useEffect(() => {
    try {
      saveInStorage(nameRef.current, value);
    } catch (err) {
      console.error(err);
    }
  }, [saveInStorage, value]);

  useEffect(() => {
    const lastName = nameRef.current;
    if (key !== lastName) {
      try {
        saveInStorage(key, value);
        nameRef.current = key;
        if (typeof window !== 'undefined') window.localStorage.removeItem(lastName);
      } catch (err) {
        console.error(err);
      }
    }
  }, [key, saveInStorage, value]);

  return [value, setValue];
}

export default usePersistedState;
