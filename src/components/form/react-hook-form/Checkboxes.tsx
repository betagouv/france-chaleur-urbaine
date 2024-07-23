import { Checkbox as DSFRCheckbox } from '@codegouvfr/react-dsfr/Checkbox';
import { FieldValues, UseControllerProps, useController } from 'react-hook-form';

export type DSFRCheckboxProps = React.ComponentProps<typeof DSFRCheckbox>;
export type CheckboxOption = {
  value: string | number;
  label?: DSFRCheckboxProps['options'][0]['label'];
  hintText?: DSFRCheckboxProps['options'][0]['hintText'];
};
export type CheckboxesProps<FormValues extends FieldValues> = UseControllerProps<FormValues> &
  Omit<DSFRCheckboxProps, 'legend' | 'options' | 'name'> & {
    options: CheckboxOption[]; // Simplify use
    label?: DSFRCheckboxProps['legend']; // harmonize with Input
    onChange?: (options?: CheckboxOption[]) => void;
  };

const Checkboxes = <FormValues extends FieldValues>({
  name,
  defaultValue,
  disabled,
  rules,
  shouldUnregister,
  onChange: onExternalChange,
  label: legend,
  options,
  ...props
}: CheckboxesProps<FormValues>) => {
  const {
    field: { onChange, value: fieldValue, ...field },
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
      options={options.map(({ value, label, hintText }) => ({
        label,
        hintText,
        nativeInputProps: {
          ...field,
          value,
          onChange: (e) => {
            let newValues = fieldValue ? [...fieldValue] : [];

            if (e.target.checked) {
              newValues.push(e.target.value);
            } else {
              newValues = newValues.filter((v) => v !== e.target.value);
            }

            onChange(newValues);
            onExternalChange?.(options.filter((o) => newValues.includes(o.value)));
          },
        },
      }))}
      legend={legend}
      state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default Checkboxes;
