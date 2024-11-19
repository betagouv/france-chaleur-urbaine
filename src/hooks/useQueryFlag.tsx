import { useQueryState } from 'nuqs';

/**
 * A custom hook for managing query flags (parameters without values).
 *
 * @param key - The name of the query parameter (flag).
 * @returns A tuple with:
 *  - The current state of the flag (`boolean`).
 *  - A function to set the flag explicitly (`setFlag`).
 *  - A function to toggle the flag (`toggleFlag`).
 */
const useQueryFlag = (key: string) => {
  const [flag, setFlag] = useQueryState<boolean | null>(key, {
    // Parse: `true` if the parameter exists, `false` otherwise
    parse: (value) => value !== null,
    // Serialize: Add parameter as empty string if `true`, remove it if `false`
    serialize: (value) => (value ? '' : null) as string,
  });

  const toggleFlag = (value?: boolean): void => {
    setFlag(value !== undefined ? value : !flag);
  };

  return [!!flag, toggleFlag];
};

export default useQueryFlag;
