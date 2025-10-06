import { useQueryState } from 'nuqs';

const useQueryFlag = (key: string): [boolean, (value?: boolean) => void] => {
  const [flag, setFlag] = useQueryState<boolean>(key, {
    defaultValue: false,
    parse: (value) => value !== null,
    serialize: (value) => (value ? '' : (null as any)),
  });

  const toggleFlag = (value?: boolean): void => {
    void setFlag(value !== undefined ? value : !flag);
  };

  return [flag, toggleFlag];
};

export default useQueryFlag;
