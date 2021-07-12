import React, { useEffect } from 'react';

function useLocalStorageState(
  initialValue: any,
  { serialize = JSON.stringify, deserialize = JSON.parse } = {}
) {
  const storedKey = '__FCU:App__';
  const [state, setState] = React.useState(() => {
    if (initialValue) return initialValue;

    const valueInLocalStorage =
      process.browser && window.localStorage.getItem(storedKey);
    if (valueInLocalStorage) {
      return deserialize(valueInLocalStorage);
    }
    return {};
  });

  const prevKeyRef = React.useRef(storedKey);

  useEffect(() => {
    const prevKey = prevKeyRef.current;
    if (prevKey !== storedKey) {
      window.localStorage.removeItem(prevKey);
    }
    prevKeyRef.current = storedKey;
    window.localStorage.setItem(storedKey, serialize(state));
  }, [storedKey, state, serialize]);

  return [state, setState];
}
export { useLocalStorageState };
