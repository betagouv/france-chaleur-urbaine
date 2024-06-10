// https://amorcelyon-my.sharepoint.com/:x:/r/personal/rbeaulieu_amorce_asso_fr/_layouts/15/Doc.aspx?sourcedoc=%7BB3D36B52-F019-42A2-9523-3BC15594260A%7D&file=1004888_20240522_AMORCE_Fichier%20calcul.xlsx&action=default&mobileredirect=true

import { useState } from 'react';
import { getTypedValue } from './helper';
import { KeyParametre, parametres } from './parametres';

export type InternalState = Record<KeyParametre, any>;
export type PublicState = Partial<InternalState>;

// on part du principe que tout se fait dans l'ordre +/-
const initialState = Object.keys(parametres).reduce((acc, paramKey) => {
  const parametre = parametres[paramKey as KeyParametre];
  acc[paramKey as KeyParametre] = 'defaultValue' in parametre ? parametre.defaultValue : parametre.defaultFormula(acc);
  return acc;
}, {} as InternalState);

export function useSimulatorState(): { internalState: InternalState; publicState: PublicState; updateState: (key: KeyParametre, value: string | boolean) => void } {
  const [internalState, setInternalState] = useState<InternalState>(initialState); // TODO build initial state
  const [publicState, setPublicState] = useState<PublicState>({});

  function updateState(key: KeyParametre, value: string | boolean) {
    console.log('updateState', key, value);
    setPublicState({
      ...publicState,
      [key]: value, // il faudra peut-être l'état de validation du champ en plus ici dans une structure plus évoluée
    });

    const parametre = parametres[key];
    const typedValue = getTypedValue(value, parametre);

    const newInternalState: InternalState = {
      ...internalState,
      [key]: typedValue !== '' ? typedValue : 'defaultValue' in parametre ? parametre.defaultValue : parametre.defaultFormula(internalState), // on veut pas toujours de la conversion
    };
    if (typeof newInternalState[key] === 'number') {
      newInternalState[key] = roundNumber(newInternalState[key]);
    }

    // gets every dependant parameter
    const parameterKeysToUpdate: KeyParametre[] = [...(parametres[key].successors ?? [])];
    let parameterKeyToUpdate: KeyParametre | undefined;
    while ((parameterKeyToUpdate = parameterKeysToUpdate.shift())) {
      const parametreToUpdate = parametres[parameterKeyToUpdate];
      console.log('update', parameterKeyToUpdate, parametreToUpdate.successors ?? []);
      parameterKeysToUpdate.push(...(parametreToUpdate.successors ?? []).filter((param) => !parameterKeysToUpdate.includes(param)));

      try {
        const publicConstant = publicState[parameterKeyToUpdate];

        newInternalState[parameterKeyToUpdate] = typeof publicConstant !== 'undefined' && publicConstant !== '' ? getTypedValue(publicConstant, parametreToUpdate) : 'defaultValue' in parametreToUpdate ? parametreToUpdate.defaultValue : parametreToUpdate.defaultFormula(newInternalState);
        if (typeof newInternalState[parameterKeyToUpdate] === 'number') {
          newInternalState[parameterKeyToUpdate] = roundNumber(newInternalState[parameterKeyToUpdate]);
        }
        console.log('-> update result', parameterKeyToUpdate, newInternalState[parameterKeyToUpdate]);
      } catch (err: any) {
        console.log('refresh error', err?.message ?? err);
      }
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
