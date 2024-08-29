import { useQueryState } from 'nuqs';

const useArrayQueryState = (name: string) => {
  const [items, setItems] = useQueryState(name, {
    defaultValue: [],
    parse: (value) => (value ? value.split(',') : []),
    serialize: (value) => value.join(','),
  });

  const add = (name: string) => {
    if (!items.includes(name)) {
      setItems((prevItems) => [...prevItems, name].filter(Boolean));
    }
  };

  const remove = (name: string) => {
    setItems((prevItems) => prevItems.filter((accordion) => accordion !== name).filter(Boolean));
  };

  const has = (name: string) => items.includes(name);

  const toggle = (name: string) => (has(name) ? remove(name) : add(name));

  const hasAndExists: typeof has = (name) => has(name) || items.length === 0;

  return { add, remove, has, toggle, hasAndExists, items };
};

export default useArrayQueryState;
