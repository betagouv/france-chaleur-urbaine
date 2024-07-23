import { Select as DSFRSelect } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';
import { FieldValues, UseControllerProps, useController } from 'react-hook-form';

export type DSFRSelectProps = React.ComponentProps<typeof DSFRSelect>;

const Select = <FormValues extends FieldValues>({
  name,
  defaultValue,
  disabled,
  rules,
  onChange: onExternalChange,
  shouldUnregister,
  hintText: hint,
  options,
  nativeSelectProps,
  ...props
}: UseControllerProps<FormValues> &
  Omit<DSFRSelectProps, 'hint'> & {
    hintText?: DSFRSelectProps['hint']; // harmonize with Input
    onChange?: (option?: DSFRSelectProps['options'][0]) => void;
  }) => {
  const {
    field: { onChange, value, ...field },
    fieldState,
  } = useController({
    name,
    defaultValue,
    disabled,
    rules,
    shouldUnregister,
  });

  return (
    <DSFRSelect
      {...field}
      nativeSelectProps={{
        ...nativeSelectProps,
        ...field,
        onChange: (e) => {
          onChange(e);
          onExternalChange?.(options.find((o) => o.value === e.target.value));
        },
      }}
      options={options.map((option) => ({
        label: option.label,
        value: option.value,
        selected: option.value === value,
      }))}
      hint={hint}
      state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default Select;
