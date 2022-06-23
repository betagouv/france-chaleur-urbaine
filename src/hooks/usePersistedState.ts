import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORED_KEY = '__FCU:App__';

type PersistedStateOption = {
  beforeStorage?: (arg: any) => void;
  keyPrefix?: string;
};

function usePersistedState(
  name: string,
  defaultValue: any,
  {
    beforeStorage = () => undefined,
    keyPrefix = STORED_KEY,
  }: PersistedStateOption = {}
): [any, React.Dispatch<React.SetStateAction<any>>] {
  const [value, setValue] = useState(defaultValue);
  const key = useMemo(() => `${keyPrefix}-${name}`, [keyPrefix, name]);
  const nameRef = useRef(key);

  const saveInStorage = useCallback(
    (key: string, value: any) => {
      if (typeof window === 'undefined') return;
      return window.localStorage.setItem(
        key,
        JSON.stringify(beforeStorage(value))
      );
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
        if (typeof window !== 'undefined')
          window.localStorage.removeItem(lastName);
      } catch (err) {
        console.error(err);
      }
    }
  }, [key, saveInStorage, value]);

  return [value, setValue];
}

export default usePersistedState;
