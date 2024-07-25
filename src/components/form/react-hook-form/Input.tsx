import React from 'react';
import { FieldValues, UseControllerProps, useController } from 'react-hook-form';

import DSFRInput from '../dsfr/Input';

export type DSFRInputProps = React.ComponentProps<typeof DSFRInput>;

const Input = <FormValues extends FieldValues>({
  name,
  defaultValue,
  disabled,
  rules,
  textArea,
  shouldUnregister,
  ...props
}: UseControllerProps<FormValues> &
  Omit<DSFRInputProps, 'nativeTextAreaProps'> & {
    textArea?: false;
  }) => {
  const { field, fieldState } = useController({
    name,
    defaultValue,
    disabled,
    rules,
    shouldUnregister,
  });

  if (rules?.required) {
    props.nativeInputProps = {
      required: true,
      ...props.nativeInputProps,
    };
  }

  return (
    <DSFRInput
      {...field}
      textArea={false}
      state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default Input;
