import { useLocalStorageValue } from '@react-hookz/web';

const prefix = process.env.IS_REVIEW_APP === 'true' ? 'App:review' : process.env.NODE_ENV === 'development' ? 'App:dev' : 'App';
export const STORED_KEY = `__FCU:${prefix}__`;

const useLocalStorage: typeof useLocalStorageValue = (name, options) => {
  return useLocalStorageValue(`${STORED_KEY}-${name}`, options);
};

export default useLocalStorage;
