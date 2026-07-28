import type { RuleName, Situation } from '@betagouv/france-chaleur-urbaine-publicodes';
import Engine from 'publicodes';
import React from 'react';

import { formatUnit } from '@/modules/publicodes/format';

type EngineConstructorParameters = ConstructorParameters<typeof Engine>;
type Rules = EngineConstructorParameters[0];
type Options = EngineConstructorParameters[1];

const usePublicodesEngine = (rules: Rules, options?: Options) => {
  const [, rerender] = React.useState({});
  const [loaded, setLoaded] = React.useState(false);

  const engine = React.useMemo(() => {
    console.time('engine');
    const e = new Engine<RuleName>(rules, options);
    console.timeEnd('engine');
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

  const updateSituation = (partialSituation: Partial<Record<RuleName, any>>) => {
    engine.setSituation({
      ...engine.getSituation(),
      ...partialSituation,
    });
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
      contexte: {
        [key]: 'non défini', // règle spéciale qui n'a pas de valeur
      },
      valeur: key,
    })?.nodeValue;
  };

  const isDefaultValue = (key: RuleName, value: any) => {
    const defaultValue = getFieldDefaultValue(key);
    // custom case as type de production froid is "Groupe froid" by default even if Inclure la climatisation is false
    if (
      key === 'climatisation . type de production' &&
      (value === "'Groupe froid'" || value === 'Groupe froid') &&
      getField('climatisation . incluse')
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

  const getOptions = (name: RuleName): string[] => {
    const rule = getParsedRule(name) || undefined;
    if (rule === undefined) {
      // si vide, c'est que c'est un booléen.
      // a changé depuis que les possibilités ne sont que des strings
      return ['oui', 'non'];
    }
    if (rule.rawNode['une possibilité']) {
      return (rule.rawNode as any)['une possibilité'].map((value: string) => value.replace(/^'+|'+$/g, '')) || [];
    }

    if (rule.rawNode['par défaut']) {
      return getOptions((rule.rawNode as any)['par défaut']);
    }

    return [];
  };

  /**
   * Convertit les booléen de nodeValue en oui ou non pour correspondre au formulaire.
   */
  const fixupBooleanEngineValue = (value: any): any => {
    return typeof value === 'boolean' ? (value ? 'oui' : 'non') : value;
  };

  /**
   * Enlève les apostrophes des string constantes de la situation pour correspondre au formulaire.
   */
  const fixupSituationStringValue = (value: any): any => {
    return typeof value === 'string' && value.at(0) === "'" && value.at(-1) === "'" ? value.substring(1, value.length - 1) : value;
  };

  return {
    fixupBooleanEngineValue,
    fixupSituationStringValue,
    getField,
    getFieldAsNumber,
    getFieldDefaultValue,
    getNode,
    getOptions,
    getRule: getParsedRule,
    getSituation,
    getUnit,
    internalEngine: engine,
    isDefaultValue,
    loaded,
    resetField,
    setField,
    setSituation,
    setStringField,
    updateSituation,
  };
};

export default usePublicodesEngine;
