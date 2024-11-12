import { useLocalStorageValue } from '@react-hookz/web';

export const STORED_KEY = `__FCU:App__`;

const useLocalStorage: typeof useLocalStorageValue = (name, options) => {
  return useLocalStorageValue(`${STORED_KEY}-${name}`, options);
};

export default useLocalStorage;
