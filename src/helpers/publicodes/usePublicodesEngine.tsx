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
  const dens = format(denominators, ' / ');
  return nums + (dens ? ' / ' + dens : '');
};

const usePublicodesEngine = <DottedName extends string>(rules: Rules, options?: Options) => {
  const [, rerender] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  const engine = React.useMemo(() => {
    console.time('engine');
    const e = new Engine(rules, options);
    console.timeEnd('engine');
    setLoading(false);
    return e;
  }, []);

  const parsedRules = engine.getParsedRules();
  const setField = (key: DottedName, value: any) => {
    engine.setSituation({
      ...engine.getSituation(),
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
    const result = getNode(key as any).nodeValue;

    if (result === null || result === undefined) {
      // console.warn(`${key} cannot be evaluated`);
      return result;
    }
    return result;
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
    loading,
    internalEngine: engine,
    getField,
    getRule: getParsedRule,
    setField,
    setSituation,
    setStringField,
    getNode,
    getUnit,
    getFieldAsNumber,
    getSituation,
  };
};

export default usePublicodesEngine;
