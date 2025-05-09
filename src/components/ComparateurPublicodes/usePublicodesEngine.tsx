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

const usePublicodesEngine = <DottedName extends string>(rules: Rules, options?: Options) => {
  const [, rerender] = React.useState({});
  const [loaded, setLoaded] = React.useState(false);

  const engine = React.useMemo(() => {
    console.time('engine');
    const e = new Engine(rules, options);
    console.timeEnd('engine');
    setLoaded(true);
    return e;
  }, []);

  const parsedRules = engine.getParsedRules();

  const setField = (key: DottedName, value: any) => {
    engine.setSituation({
      ...engine.getSituation(),
      [key as any]: value === '' || value === undefined ? null : value,
    });
    rerender({});
  };

  const resetField = (key: DottedName) => {
    engine.setSituation({
      ...Object.fromEntries(Object.entries(engine.getSituation()).filter(([k]) => k !== key)),
    });
    rerender({});
  };

  const setSituation = (situation: Partial<Record<DottedName, any>>) => {
    engine.setSituation(situation);
    rerender({});
  };

  const setStringField = (key: DottedName, value: any) => {
    setField(key, value === '' ? null : `'${value}'`);
  };

  if (typeof window !== 'undefined') {
    (window as any).engine = engine;
  }

  const getNode = (key: DottedName) => {
    const result = engine.evaluate(key as any);

    if (result === null || result === undefined) {
      // console.warn(`${key} cannot be evaluated`);
      return {} as typeof result;
    }
    return result;
  };

  const getField = (key: DottedName) => {
    return getNode(key as any).nodeValue;
  };

  const getFieldDefaultValue = (key: DottedName) => {
    return engine.evaluate({
      valeur: key,
      contexte: {
        [key]: 'non défini', // règle spéciale qui n'a pas de valeur
      },
    })?.nodeValue;
  };

  const isDefaultValue = (key: DottedName, value: any) => {
    const defaultValue = getFieldDefaultValue(key as any);
    // custom case as type de production froid is "Groupe froid" by default even if Inclure la climatisation is false
    if (
      key === 'type de production de froid' &&
      (value === "'Groupe froid'" || value === 'Groupe froid') &&
      getField('Inclure la climatisation' as DottedName)
    ) {
      return false;
    }

    if (defaultValue === true && value === 'oui') return true;
    if (defaultValue === false && value === 'non') return true;
    if (typeof value === 'string') return defaultValue === value || defaultValue === `'${value}'` || value === `'${defaultValue}'`;
    return defaultValue === value;
  };

  const getFieldAsNumber = (key: DottedName) => {
    return (getField(key) as number) || 0;
  };

  const getUnit = (key: DottedName) => {
    const node = getNode(key as any);
    const unit = !node?.unit ? '' : formatUnit(node.unit);
    return unit;
  };

  const getParsedRule = (key: DottedName) => parsedRules[key as string];

  const getSituation = () => {
    return engine.getSituation() as Record<DottedName, number | string>;
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
