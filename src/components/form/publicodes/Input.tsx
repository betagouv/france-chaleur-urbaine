import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import React, { useState } from 'react';

import { upperCaseFirstChar } from '@utils/strings';

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
    name: DottedName;
    label: string;
  }) => {
  const { engine } = usePublicodesFormContext();
  const placeholder = engine.getField(name) as string | number;
  const value = engine.getSituation()[name];
  const unit = engine.getUnit(name);

  const [valueType] = useState(typeof placeholder);
  const fieldType = valueType === 'number' ? 'number' : 'text';

  return (
    <DSFRInput
      textArea={false}
      label={
        <>
          {upperCaseFirstChar(label)}
          {unit ? <small> ({unit})</small> : ''}
        </>
      }
      hideOptionalLabel
      nativeInputProps={{
        ...nativeInputProps,
        type: fieldType,
        value: value ?? '',
        placeholder: `${placeholder}`,
        onChange: (e) => {
          e.stopPropagation();
          const newValue = e.target.value;
          engine.setField(name, newValue);
        },
      }}
      // state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? 'Sélectionnez une valeur'}
      {...props}
    />
  );
};

export default Input;
