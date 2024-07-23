import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import {
  FieldValues,
  UseControllerProps,
  useController,
} from 'react-hook-form';

export type ToggleSwitchProps = React.ComponentProps<typeof ToggleSwitch>;

const RadioInput = <FormValues extends FieldValues>({
  name,
  defaultValue,
  disabled,
  rules,
  shouldUnregister,
  hintText: helperText,
  inputTitle,
  ...props
}: UseControllerProps<FormValues> &
  Omit<ToggleSwitchProps, 'helperText'> & {
    hintText?: ToggleSwitchProps['helperText'];
  }) => {
  const {
    field: { value, ...field },
  } = useController({
    name,
    defaultValue,
    disabled,
    rules,
    shouldUnregister,
  });

  // TODO handle error as it's not supported by DSFR
  return (
    <ToggleSwitch
      {...field}
      checked={value as any}
      inputTitle={
        inputTitle || '' /* Because inputTitle is mandatory in DSFR */
      }
      helperText={helperText}
      {...props}
    />
  );
};

export default RadioInput;
