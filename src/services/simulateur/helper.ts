export const typeBool: unique symbol = Symbol('bool');
export const typeNumber: unique symbol = Symbol('number');
export const typeString: unique symbol = Symbol('string');

// type Parametres<
//   Keys extends string,
//   Type = TypeBool | TypeNumber | TypeString,
// > = {
//   [K in Keys]: {
//     default:
//       | ((
//           getValue: (key: Keys) => number | string | boolean
//         ) => ParametreType<Type> | undefined)
//       | ParametreType<Type>
//       | undefined;
//     type?: Type;
//     unit?: string;
//     deps?: string[];
//   };
// };

type Parametres<T extends Record<string, Parametre<T>>> = {
  [K in keyof T]: Parametre<T>;
};

type Parametre<T extends Record<string, Parametre<T>>> = {
  // default: number | string | boolean | undefined | ((getValue: (key: string) => number | string | boolean | undefined) => number | string | boolean | undefined); // FIXME `key: string` devrait être keyof T, mais pas possible avec typescript :/
  // on utilise 2 champs séparés car problème typescript
  type?: typeof typeBool | typeof typeNumber | typeof typeString; // default to number
  unit?: string;
  predecessors?: (keyof T)[]; // = parameters used in default formula
  successors?: (keyof T)[]; // computed automatically from predecessors
} & (
  | {
      defaultValue?: number | string | boolean | undefined;
    }
  | {
      defaultFormula?: (state: Record<keyof T, number | string | boolean | undefined>) => number | string | boolean | undefined;
    }
);

export function createParametresObject<T extends Record<string, Parametre<T>>>(obj: T & Parametres<T>) {
  return obj;
}

// export function getTypedValue(value: string): string | number | boolean {
//   return value === '' ? '' : !isNaN(Number(value)) ? Number(value) : value;
// }

export function getTypedValue(value: string | boolean, paramConfig: Parametre<any>): string | number | boolean {
  return typeof value === 'boolean' ? value : paramConfig.type === typeNumber && !isNaN(Number(value)) ? Number(value) : value;
  // return value === '' ? '' : !isNaN(Number(value)) ? Number(value) : value;
}
