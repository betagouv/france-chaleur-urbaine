import React from 'react';

import DSFRInput from '../dsfr/Input';
import { usePublicodesFormContext } from '../publicodes/FormProvider';

export type DSFRInputProps = React.ComponentProps<typeof DSFRInput>;

const Input = ({
  name,
  textArea,
  nativeInputProps,
  ...props
}: DSFRInputProps &
  Omit<DSFRInputProps, 'nativeTextAreaProps'> & {
    textArea?: false;
    name: string;
  }) => {
  const { engine } = usePublicodesFormContext();

  return (
    <DSFRInput
      textArea={false}
      nativeInputProps={{
        ...nativeInputProps,
        value: engine.getField(name),
        onChange: (e) => {
          e.stopPropagation();
          engine.setStringField(name, e.target.value);
        },
      }}
      // state={props.state ?? fieldState.error ? 'error' : 'default'}
      // stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default Input;
