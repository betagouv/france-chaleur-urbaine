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
  const [value, setValue] = React.useState(engine.getField(name));
  const [canBeEmpty] = React.useState(!engine.getField(name));

  const onChangeField = (newValue: string) => {
    setValue(newValue);
    engine.setStringField(name, newValue);
  };

  return (
    <DSFRInput
      textArea={false}
      nativeInputProps={{
        ...nativeInputProps,
        value,
        placeholder: engine.getField(name),
        onChange: (e) => {
          e.stopPropagation();
          onChangeField(e.target.value);
        },
      }}
      state={props.state ?? (!canBeEmpty && value === '') ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? 'Sélectionnez une valeur'}
      {...props}
    />
  );
};

export default Input;
