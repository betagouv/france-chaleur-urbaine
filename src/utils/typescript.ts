import { type Timestamp } from '@/server/db/kysely';

/**
 * Get all keys and nested keys of an object separated by dots, filtered by value type.
 */
export type FlattenKeys<Type, ValueType = any> =
  Type extends Array<any> ? never : Type extends Record<string, any> ? InternalFlattenKeys<Type, ValueType> : '';

type InternalFlattenKeys<Obj, ValueType> =
  Obj extends Record<string, any>
    ? {
        [Key in keyof Obj]:
          | (Obj[Key] extends ValueType ? `${Key & string}` : never)
          | (Obj[Key] extends Record<string, any> | null
              ? Obj[Key] extends null
                ? never
                : `${Key & string}.${FlattenKeys<NonNullable<Obj[Key]>, ValueType> & string}`
              : never);
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

export type RequireProps<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

export type ExtractKeys<T, Prop extends keyof any> = T extends readonly Record<Prop, infer K>[] ? K : never;

export type ExtractKeysOfType<T, Prop> = {
  [K in keyof T]: T[K] extends Prop ? K : never;
}[keyof T];

export type NonEmptyArray<T> = [T, ...T[]];

export function nonEmptyArray<T>(array: T[]) {
  return array as NonEmptyArray<T>;
}

export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Converts types for frontend when types comes from kysely
 */
export type FrontendType<T> = {
  [K in keyof T]: T[K] extends Timestamp | Date ? string : T[K];
};

export type OmitFirst<T extends any[]> = T extends [any, ...infer R] ? R : never;

/**
 * Make fields partial for a type
 */
export type Partialize<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Check if an object has a property.
 * Returns true if the property exists, false otherwise and typechecks the key.
 */
export function hasProperty<T extends object>(obj: T, key: string | number | symbol): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Exclude keys from an object
 */
export type ExcludeKeys<T, U> = { [K in keyof T]?: never } & Record<string, U>;
