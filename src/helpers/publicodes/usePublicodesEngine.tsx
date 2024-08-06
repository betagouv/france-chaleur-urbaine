import Engine from 'publicodes';
import React from 'react';

type EngineConstructorParameters = ConstructorParameters<typeof Engine>;
type Rules = EngineConstructorParameters[0];
type Options = EngineConstructorParameters[1];

const usePublicodesEngine = <DottedName,>(rules: Rules, options?: Options) => {
  const [, rerender] = React.useState({});

  const engine = React.useMemo(() => new Engine(rules, options), []);

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
      return '';
    }
    return `${result}`;
  };
  return {
    getField,
    setField,
    setStringField,
  };
};

export default usePublicodesEngine;
