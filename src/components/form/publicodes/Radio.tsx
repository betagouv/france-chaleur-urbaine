import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';

import { usePublicodesFormContext } from './FormProvider';

export type RadioButtonsProps = React.ComponentProps<typeof RadioButtons>;
export type RadioOption = { value: string | number; label?: string };

const getOptions = (engine: ReturnType<typeof usePublicodesFormContext>['engine'], name: string): string[] => {
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
const fixupBooleanEngineValue = (value: any): any => {
  return typeof value === 'boolean' ? (value ? 'oui' : 'non') : value;
};

const RadioInput = ({
  name,
  label: legend,
  ...props
}: Omit<RadioButtonsProps, 'legend' | 'options' | 'name'> & {
  name: string;
  label?: RadioButtonsProps['legend']; // harmonize with Input
}) => {
  const { engine } = usePublicodesFormContext();

  const options = getOptions(engine, name);
  const valueInEngine = fixupBooleanEngineValue(engine.getField(name));

  return (
    <RadioButtons
      name={name}
      options={options.map((optionValue) => ({
        label: optionValue,
        nativeInputProps: {
          checked: optionValue === valueInEngine,
          value: optionValue,
          onChange: (e) => {
            e.stopPropagation();
            const value = e.target.value;
            if (['oui', 'non'].includes(value)) {
              engine.setField(name, value);
            } else {
              engine.setStringField(name, value);
            }
          },
        },
      }))}
      legend={legend}
      // state={props.state ?? fieldState.error ? 'error' : 'default'}
      // stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default RadioInput;
