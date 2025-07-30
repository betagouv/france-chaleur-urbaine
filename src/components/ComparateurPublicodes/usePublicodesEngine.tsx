import { type RuleName, type Situation } from '@betagouv/france-chaleur-urbaine-publicodes';
import Engine from 'publicodes';
import React from 'react';

type EngineConstructorParameters = ConstructorParameters<typeof Engine>;
type Rules = EngineConstructorParameters[0];
type Options = EngineConstructorParameters[1];

type Unit = {
  numerators: string[];
  denominators: string[];
};

export const formatUnit = ({ numerators, denominators }: Unit): string => {
  const superscript = ['\u2070', '\u00B9', '\u00B2', '\u00B3', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078', '\u2079'];
  const format = (arr: string[], delimiter: string = ''): string => {
    const count: Record<string, number> = arr.reduce((acc: Record<string, number>, curr: string) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(count)
      .map(([key, value]) => key + (value > 1 ? superscript[value] : ''))
      .join(delimiter);
  };
  const nums = format(numerators);
  const dens = format(denominators, '/');
  return nums + (dens ? ' / ' + dens : '');
};

const usePublicodesEngine = (rules: Rules, options?: Options) => {
  const [, rerender] = React.useState({});
  const [loaded, setLoaded] = React.useState(false);

  const engine = React.useMemo(() => {
    console.time('engine'); // eslint-disable-line no-console
    const e = new Engine<RuleName>(rules, options);
    console.timeEnd('engine'); // eslint-disable-line no-console
    setLoaded(true);
    return e;
  }, []);

  const parsedRules = engine.getParsedRules();

  const setField = <Key extends RuleName>(key: Key, value: Required<Situation>[Key] | '') => {
    engine.setSituation({
      ...engine.getSituation(),
      [key]: value === '' || value === undefined ? null : value,
    });
    rerender({});
  };

  const resetField = (key: RuleName) => {
    engine.setSituation({
      ...Object.fromEntries(Object.entries(engine.getSituation()).filter(([k]) => k !== key)),
    });
    rerender({});
  };

  const setSituation = (situation: Partial<Record<RuleName, any>>) => {
    engine.setSituation(situation);
    rerender({});
  };

  const setStringField = (key: RuleName, value: any) => {
    setField(key, value === '' ? null : `'${value}'`);
  };

  if (typeof window !== 'undefined') {
    (window as any).engine = engine;
  }

  const getNode = (key: RuleName) => {
    const result = engine.evaluate(key as any);

    if (result === null || result === undefined) {
      // console.warn(`${key} cannot be evaluated`);
      return {} as typeof result;
    }
    return result;
  };

  const getField = (key: RuleName) => {
    return getNode(key).nodeValue;
  };

  const getFieldDefaultValue = (key: RuleName) => {
    return engine.evaluate({
      valeur: key,
      contexte: {
        [key]: 'non défini', // règle spéciale qui n'a pas de valeur
      },
    })?.nodeValue;
  };

  const isDefaultValue = (key: RuleName, value: any) => {
    const defaultValue = getFieldDefaultValue(key);
    // custom case as type de production froid is "Groupe froid" by default even if Inclure la climatisation is false
    if (
      key === 'type de production de froid' &&
      (value === "'Groupe froid'" || value === 'Groupe froid') &&
      getField('Inclure la climatisation' as RuleName)
    ) {
      return false;
    }

    if (defaultValue === true && value === 'oui') return true;
    if (defaultValue === false && value === 'non') return true;
    if (typeof value === 'string') return defaultValue === value || defaultValue === `'${value}'` || value === `'${defaultValue}'`;
    return defaultValue === value;
  };

  const getFieldAsNumber = (key: RuleName) => {
    return (getField(key) as number) || 0;
  };

  const getUnit = (key: RuleName) => {
    const node = getNode(key as any);
    const unit = !node?.unit ? '' : formatUnit(node.unit);
    return unit;
  };

  const getParsedRule = (key: RuleName) => parsedRules[key];

  const getSituation = () => {
    return engine.getSituation() as Record<RuleName, number | string>;
  };

  return {
    loaded,
    internalEngine: engine,
    getField,
    getRule: getParsedRule,
    getFieldDefaultValue,
    setField,
    setSituation,
    setStringField,
    getNode,
    getUnit,
    isDefaultValue,
    resetField,
    getFieldAsNumber,
    getSituation,
  };
};

export default usePublicodesEngine;
