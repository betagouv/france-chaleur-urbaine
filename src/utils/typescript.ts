/**
 * Get all keys and nested keys of an object separated by dots, filtered by value type.
 */
export type FlattenKeys<Type, ValueType = any> = Type extends Array<any>
  ? never
  : Type extends Record<string, any>
  ? InternalFlattenKeys<Type, ValueType>
  : '';

type InternalFlattenKeys<Obj, ValueType> = Obj extends Record<string, any>
  ? {
      [Key in keyof Obj]:
        | (Obj[Key] extends ValueType ? `${Key & string}` : never)
        | (Obj[Key] extends Record<string, any> ? `${Key & string}.${FlattenKeys<Obj[Key], ValueType> & string}` : never);
    }[keyof Obj]
  : never;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Preserve keys of object instead of returning string[].
 */
export function ObjectKeys<Obj extends object>(obj: Obj): (keyof Obj)[] {
  return Object.keys(obj) as (keyof Obj)[];
}

/**
 * Preserve keys of object instead of returning string[].
 */
export function ObjectEntries<Obj extends object>(obj: Obj) {
  return Object.entries(obj) as {
    [K in keyof Obj]: [K, Obj[K]];
  }[keyof Obj][];
}
