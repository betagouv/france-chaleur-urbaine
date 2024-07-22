import React from 'react';
import {
  FieldValues,
  UseControllerProps,
  useController,
} from 'react-hook-form';
import DSFRInput from '../Input';

const TextArea = <FormValues extends FieldValues>({
  name,
  defaultValue,
  disabled,
  rules,
  shouldUnregister,
  textArea,
  ...props
}: UseControllerProps<FormValues> & React.ComponentProps<typeof DSFRInput>) => {
  const { field, fieldState } = useController({
    name,
    defaultValue,
    disabled,
    rules,
    shouldUnregister,
  });
  if (rules?.required) {
    props.nativeTextAreaProps = {
      required: true,
      ...props.nativeTextAreaProps,
    };
  }
  return (
    <DSFRInput
      {...field}
      textArea={true as any}
      state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={
        props.stateRelatedMessage ?? fieldState.error?.message
      }
      {...props}
    />
  );
};

export default TextArea;
