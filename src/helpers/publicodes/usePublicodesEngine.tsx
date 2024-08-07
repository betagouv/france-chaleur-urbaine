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

  const getField = (key: DottedName) => {
    const result = engine.evaluate(key as any).nodeValue;

    if (result === null || result === undefined) {
      console.warn(`${key} cannot be evaluated`);
      return null;
    }
    return result;
  };

  const getStringField = (key: DottedName) => {
    return `${getField(key) ?? ''}`;
  };

  const getNumberField = (key: DottedName): number => {
    return (getField(key) as number) ?? 0;
  };

  const getParsedRule = (key: DottedName) => parsedRules[key as string];

  return {
    getField,
    getStringField,
    getNumberField,
    getRule: getParsedRule,
    setField,
    setStringField,
  };
};

export default usePublicodesEngine;
