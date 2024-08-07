import React from 'react';

import DSFRInput from '../dsfr/Input';
import { usePublicodesFormContext } from '../publicodes/FormProvider';

export type DSFRInputProps = React.ComponentProps<typeof DSFRInput>;

const Input = ({
  name,
  textArea,
  nativeInputProps,
  label,
  ...props
}: DSFRInputProps &
  Omit<DSFRInputProps, 'nativeTextAreaProps'> & {
    textArea?: false;
    name: string;
  }) => {
  const { engine } = usePublicodesFormContext();
  // const [value, setValue] = React.useState(engine.getField(name) as string | number);
  const value = engine.getField(name) as string | number;
  const unit = engine.getUnit(name);
  const [canBeEmpty] = React.useState(engine.getField(name) === null || engine.getField(name) === undefined);
  const [isEmpty, setIsEmpty] = React.useState(canBeEmpty);

  return (
    <DSFRInput
      textArea={false}
      label={
        <>
          {label}
          {unit ? <small> ({unit})</small> : ''}
        </>
      }
      nativeInputProps={{
        ...nativeInputProps,
        value: isEmpty ? '' : value,
        placeholder: `${engine.getField(name)}`,
        onChange: (e) => {
          e.stopPropagation();
          const newValue = e.target.value;
          setIsEmpty(newValue === '');
          engine.setField(name, newValue);
        },
      }}
      state={props.state ?? (!canBeEmpty && isEmpty) ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? 'Sélectionnez une valeur'}
      {...props}
    />
  );
};

export default Input;
