export function createParametresObject<T extends Record<keyof T, Parametre<T>>>(obj: T & Parametres<T>) {
  return obj;
}

type Parametres<T extends Record<keyof T, Parametre<T>>> = {
  [K in keyof T]: Parametre<T>;
};

type Parametre<T extends Record<keyof T, Parametre<T>>> = {
  type?: ValueType; // default to typeNumber
  options?: ParametreOption[];
  unit?: string;
  predecessors?: (keyof T)[]; // = parameters used in default formula
  successors?: (keyof T)[]; // computed automatically from predecessors
} & (
  | {
      defaultValue: number | string | boolean | undefined;
    }
  | {
      /**
       * Chaque formule peut utiliser d'autres variables via la fonction getValue(<id_variable>) si jamais la variable demandée n'est pas définie alors une exception est levée et
       * le traitement est arrêté pour cette variable. Son état dans le state sera alors défini à undefined.
       */
      defaultFormula: (getValue: (key: keyof T) => any) => number | string | boolean | undefined;
    }
);

export const typeBool: unique symbol = Symbol('bool');
export const typeNumber: unique symbol = Symbol('number');
export const typeString: unique symbol = Symbol('string');

export type ValueType = typeof typeBool | typeof typeNumber | typeof typeString;

type ExtractTypeFromField<Type extends ValueType | undefined> = Type extends typeof typeBool ? boolean : Type extends typeof typeString ? string : number;

export function getTypedValue(value: string | boolean, type: ValueType): ExtractTypeFromField<typeof type> | null {
  switch (type) {
    case typeBool:
    case typeString:
      return value;
    case typeNumber:
      return !isNaN(parseFloat(value as string)) ? parseFloat(value as string) : null;
  }
}

type ParametreOption = {
  value: string;
  label: string;
};

export type ExtractStateFromParametres<P extends Record<keyof P, Parametre<P>>> = {
  [K in keyof P]: P[K]['type'] extends 'bool' ? boolean : P[K]['type'] extends 'string' ? string : number;
};

export function completeSuccessors<T extends Record<string, Parametre<T>>>(parametres: Parametres<T>) {
  const successorsByParametre = Object.entries(parametres).reduce(
    (acc, [parametreKey, parametre]) => {
      parametre.predecessors?.forEach((predecessor: keyof typeof parametres) => {
        let predecessorSuccessors = acc[predecessor];
        if (!predecessorSuccessors) {
          acc[predecessor] = predecessorSuccessors = [] as (keyof typeof parametres)[];
        }
        predecessorSuccessors.push(parametreKey as keyof typeof parametres);
      });
      return acc;
    },
    {} as Record<keyof typeof parametres, (keyof typeof parametres)[]>
  );
  Object.entries(successorsByParametre).forEach(([parametreKey, successors]) => {
    parametres[parametreKey as keyof typeof parametres].successors = successors;
  });
}
