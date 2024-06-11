// https://amorcelyon-my.sharepoint.com/:x:/r/personal/rbeaulieu_amorce_asso_fr/_layouts/15/Doc.aspx?sourcedoc=%7BB3D36B52-F019-42A2-9523-3BC15594260A%7D&file=1004888_20240522_AMORCE_Fichier%20calcul.xlsx&action=default&mobileredirect=true

import { isDefined } from '@utils/core';
import { ObjectKeys } from '@utils/typescript';
import { useState } from 'react';
import { ExtractStateFromParametres, getTypedValue, typeNumber } from './helper';
import { KeyParametre, parametres } from './parametres';

export type InternalState = ExtractStateFromParametres<typeof parametres>;

// strings or booleans
export type PublicState = {
  [P in keyof InternalState]?: InternalState[P] extends number ? string : InternalState[P];
};

// on part du principe que tout se fait dans l'ordre +/-
const initialInternalState = ObjectKeys(parametres).reduce((acc, paramKey) => {
  const parametre = parametres[paramKey as KeyParametre];
  const newValue =
    'defaultValue' in parametre
      ? parametre.defaultValue
      : tryFormula(() =>
          parametre.defaultFormula((key) => {
            if (!isDefined(acc[key])) {
              throw new Error(`missing state value for '${key}'`);
            }
            return acc[key];
          })
        );
  (acc[paramKey] as any) = typeof newValue === 'number' ? roundNumber(newValue) : newValue;
  return acc;
}, {} as InternalState);

export function useSimulatorState(): { internalState: InternalState; publicState: PublicState; updateState: (key: KeyParametre, value: string | boolean) => void } {
  const [internalState, setInternalState] = useState<InternalState>(initialInternalState);
  const [publicState, setPublicState] = useState<PublicState>({});

  function updateState(key: KeyParametre, value: string | boolean) {
    console.log('updateState', key, value);
    setPublicState({
      ...publicState,
      [key]: value, // il faudra peut-être l'état de validation du champ en plus ici dans une structure plus évoluée
    });

    const parametre = parametres[key];
    const valueType = parametre.type ?? typeNumber;
    const typedValue = getTypedValue(value, valueType);

    const newInternalState: InternalState = {
      ...internalState,
    };

    function getValue(key: KeyParametre) {
      if (!isDefined(newInternalState[key])) {
        throw new Error(`missing state value for '${key}'`);
      }
      return newInternalState[key];
    }

    const newValue = value !== '' ? typedValue : 'defaultValue' in parametre ? parametre.defaultValue : tryFormula(() => parametre.defaultFormula(getValue));
    newInternalState[key] = typeof newValue === 'number' ? roundNumber(newValue) : typedValue !== null ? newValue : undefined;

    // gets every dependant parameter
    const parameterKeysToUpdate: KeyParametre[] = [...(parametres[key].successors ?? [])];
    let parameterKeyToUpdate: KeyParametre | undefined;
    while ((parameterKeyToUpdate = parameterKeysToUpdate.shift())) {
      const parametreToUpdate = parametres[parameterKeyToUpdate];
      console.log('update', parameterKeyToUpdate, parametreToUpdate.successors ?? []);
      parameterKeysToUpdate.push(...(parametreToUpdate.successors ?? []).filter((param) => !parameterKeysToUpdate.includes(param)));

      const publicConstant = publicState[parameterKeyToUpdate];
      const newValue = isPublicVariableDefined(publicConstant) ? getTypedValue(publicConstant, parametreToUpdate.type ?? typeNumber) : 'defaultValue' in parametreToUpdate ? parametreToUpdate.defaultValue : tryFormula(() => parametreToUpdate.defaultFormula(getValue));
      newInternalState[parameterKeyToUpdate] = typeof newValue === 'number' ? roundNumber(newValue) : newValue;
    }
    setInternalState(newInternalState);
  }

  return {
    publicState,
    internalState,
    updateState,
  };
}

// used to remove precision errors e.g. 1.4*3 => 4.199999
function roundNumber(v: number): number {
  return Math.round(v * 100) / 100;
}

function tryFormula(callback: () => any) {
  try {
    return callback();
  } catch (err: any) {
    console.log('formula error', err?.message ?? err);
    return undefined;
  }
}

function isPublicVariableDefined<Type>(value: Type | undefined | null | ''): value is Type {
  return isDefined(value) && value !== '';
}
