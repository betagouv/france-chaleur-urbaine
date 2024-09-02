import { usePublicodesFormContext } from './FormProvider';

export const getOptions = (engine: ReturnType<typeof usePublicodesFormContext>['engine'], name: string): string[] => {
  const rule = engine.getRule(name);
  if (rule.rawNode['une possibilité']) {
    return (rule.rawNode as any)['une possibilité']['possibilités'].map((value: string) => value.replace(/^'+|'+$/g, '')) || [];
  }

  if (rule.rawNode['par défaut']) {
    return getOptions(engine, (rule.rawNode as any)['par défaut']);
  }

  return [];
};

// Convertit les booléen de nodeValue en oui ou non pour correspondre au formulaire.
export const fixupBooleanEngineValue = (value: any): any => {
  return typeof value === 'boolean' ? (value ? 'oui' : 'non') : value;
};
