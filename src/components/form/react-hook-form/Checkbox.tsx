import { Checkbox as DSFRCheckbox } from '@codegouvfr/react-dsfr/Checkbox';
import { FieldValues, UseControllerProps, useController } from 'react-hook-form';

export type DSFRCheckboxProps = React.ComponentProps<typeof DSFRCheckbox>;
export type CheckboxOption = {
  value: string | number;
  label?: DSFRCheckboxProps['options'][0]['label'];
  hintText?: DSFRCheckboxProps['options'][0]['hintText'];
};
export type CheckboxProps<FormValues extends FieldValues> = UseControllerProps<FormValues> &
  Omit<DSFRCheckboxProps, 'options' | 'name'> & {
    hintText?: CheckboxOption['hintText'];
    label?: CheckboxOption['label'];
    onChange?: (newValue: boolean) => void;
  };

const Checkbox = <FormValues extends FieldValues>({
  name,
  defaultValue,
  disabled,
  rules,
  shouldUnregister,
  onChange: onExternalChange,
  label,
  hintText,
  legend,
  ...props
}: CheckboxProps<FormValues>) => {
  const {
    field: { onChange, ...field },
    fieldState,
  } = useController({
    name,
    defaultValue,
    disabled,
    rules,
    shouldUnregister,
  });

  return (
    <DSFRCheckbox
      options={[
        {
          label,
          hintText,
          nativeInputProps: {
            ...field,
            onChange: (e) => {
              onChange(e.target.checked);
              onExternalChange?.(e.target.checked);
            },
          },
        },
      ]}
      legend={legend}
      state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default Checkbox;
