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
