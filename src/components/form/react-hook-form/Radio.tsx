import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';
import {
  FieldValues,
  UseControllerProps,
  useController,
} from 'react-hook-form';

export type RadioButtonsProps = React.ComponentProps<typeof RadioButtons>;
export type RadioOption = { value: string | number; label?: string };

const RadioInput = <FormValues extends FieldValues>({
  name,
  defaultValue,
  disabled,
  rules,
  shouldUnregister,
  label: legend,
  options,
  ...props
}: UseControllerProps<FormValues> &
  Omit<RadioButtonsProps, 'legend' | 'options'> & {
    options: RadioOption[]; // Simplify use
    label?: RadioButtonsProps['legend']; // harmonize with Input
  }) => {
  const { field, fieldState } = useController({
    name,
    defaultValue,
    disabled,
    rules,
    shouldUnregister,
  });
  return (
    <RadioButtons
      {...field}
      options={options.map(({ value, label }) => ({
        label,
        nativeInputProps: {
          value,
        },
      }))}
      legend={legend}
      state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={
        props.stateRelatedMessage ?? fieldState.error?.message
      }
      {...props}
    />
  );
};

export default RadioInput;
