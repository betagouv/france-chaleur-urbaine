import Engine from 'publicodes';
import React from 'react';

type EngineConstructorParameters = ConstructorParameters<typeof Engine>;
type Rules = EngineConstructorParameters[0];
type Options = EngineConstructorParameters[1];

const usePublicodesEngine = <DottedName,>(rules: Rules, options?: Options) => {
  const [, rerender] = React.useState({});

  const engine = React.useMemo(() => new Engine(rules, options), []);

  const parsedRules = engine.getParsedRules();
  const setField = (key: DottedName, value: any) => {
    engine.setSituation({
      ...engine.getSituation(),
      [key as any]: value === '' ? null : value,
    });
    rerender({});
  };

  const setStringField = (key: DottedName, value: any) => {
    setField(key, value === '' ? null : `'${value}'`);
  };

  if (typeof window !== 'undefined' && !(window as any).engine) {
    (window as any).engine = engine;
  }

  const getNode = (key: DottedName) => {
    const result = engine.evaluate(key as any);

    if (result === null || result === undefined) {
      console.warn(`${key} cannot be evaluated`);
      return {} as typeof result;
    }
    return result;
  };

  const getField = (key: DottedName) => {
    const result = getNode(key as any).nodeValue;

    if (result === null || result === undefined) {
      console.warn(`${key} cannot be evaluated`);
      return '';
    }
    return result;
  };

  const getParsedRule = (key: DottedName) => parsedRules[key as string];

  return {
    getField,
    getRule: getParsedRule,
    setField,
    setStringField,
    getNode,
  };
};

export default usePublicodesEngine;
