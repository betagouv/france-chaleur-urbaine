import { useQueryState } from 'nuqs';

const useArrayQueryState = <Type extends string>(name: string) => {
  const [items, setItems] = useQueryState<Type[]>(name, {
    defaultValue: [],
    parse: (value) => (value ? (value.split(',') as Type[]) : []),
    serialize: (value) => value.join(','),
  });

  const set = (newItems: Type[]) => {
    setItems(newItems.length > 0 ? newItems : null);
  };

  const add = (name: Type) => {
    if (!items.includes(name)) {
      setItems((prevItems) => {
        const newItems = [...prevItems, name].filter(Boolean);

        return newItems.length > 0 ? newItems : null;
      });
    }
  };

  const remove = (name: Type) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((accordion) => accordion !== name);

      // If no items are left, remove the query param by setting null
      return newItems.length > 0 ? newItems : null;
    });
  };

  const has = (name: Type) => items.includes(name);

  const toggle = (name: Type) => (has(name) ? remove(name) : add(name));

  return { add, remove, has, toggle, set, items };
};

export default useArrayQueryState;
