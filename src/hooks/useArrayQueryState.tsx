import { useQueryState } from 'nuqs';

const useArrayQueryState = <Type extends string>(name: string) => {
  const [items, setItems] = useQueryState<Type[]>(name, {
    defaultValue: [],
    parse: (value) => (value ? (value.split(',') as Type[]) : []),
    serialize: (value) => value.join(','),
  });

  const add = (name: Type) => {
    if (!items.includes(name)) {
      setItems((prevItems) => [...prevItems, name].filter(Boolean));
    }
  };

  const remove = (name: Type) => {
    setItems((prevItems) => prevItems.filter((accordion) => accordion !== name).filter(Boolean));
  };

  const has = (name: Type) => items.includes(name);

  const toggle = (name: Type) => (has(name) ? remove(name) : add(name));

  return { add, remove, has, toggle, items };
};

export default useArrayQueryState;
