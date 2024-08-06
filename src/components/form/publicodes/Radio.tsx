import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';

import { usePublicodesFormContext } from './FormProvider';

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

  const options: string[] = (engine.getRule(name) as any).rawNode['une possibilité']['possibilités'].map((value: string) =>
    value.replace(/^'+|'+$/g, '')
  );
  const valueInEngine = engine.getField(name);

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
            engine.setStringField(name, e.target.value);
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
