/**
 * Get all keys and nested keys of an object separated by dots.
 */
export type FlattenKeys<Type> = Type extends Array<any>
  ? never
  : Type extends Record<string, any>
  ? InternalFlattenKeys<Type>
  : '';

type InternalFlattenKeys<Obj> = Obj extends Record<string, any>
  ? {
      [Key in keyof Obj]:
        | `${Key & string}`
        | (Obj[Key] extends Record<string, any>
            ? `${Key & string}.${FlattenKeys<Obj[Key]> & string}`
            : never);
    }[keyof Obj]
  : never;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
