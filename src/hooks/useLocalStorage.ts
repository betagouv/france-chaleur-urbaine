import { useRef, useState } from 'react';

const STORED_KEY = '__FCU:App__';

const getLsKey = (key: string) => `${STORED_KEY}-${key}`;

function useLocalStorage<T>(initialKey: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const key = getLsKey(initialKey);

    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useRef((value: T | ((val: T) => T)) => {
    const key = getLsKey(initialKey);
    try {
      const valueToStore = value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  });

  return [storedValue, setValue.current] as const;
}

export default useLocalStorage;
