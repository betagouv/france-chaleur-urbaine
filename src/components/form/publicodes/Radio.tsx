import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';

import { usePublicodesFormContext } from './FormProvider';
import { fixupBooleanEngineValue, getOptions } from './helpers';

export type RadioButtonsProps = React.ComponentProps<typeof RadioButtons>;
export type RadioOption = { value: string | number; label?: string };

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
