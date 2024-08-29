import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useDebouncedEffect } from '@react-hookz/web';
import React from 'react';

import { isDefined } from '@utils/core';
import { upperCaseFirstChar } from '@utils/strings';

import DSFRInput from '../dsfr/Input';
import { usePublicodesFormContext } from '../publicodes/FormProvider';
export type DSFRInputProps = React.ComponentProps<typeof DSFRInput>;

const Input = ({
  name,
  placeholderPrecision,
  textArea,
  nativeInputProps,
  label,
  ...props
}: DSFRInputProps &
  Omit<DSFRInputProps, 'nativeTextAreaProps'> & {
    textArea?: false;
    placeholderPrecision?: number;
    name: DottedName;
    label: string;
  }) => {
  const { engine } = usePublicodesFormContext();
  const placeholder = engine.getField(name) as number | null | undefined;
  const unit = engine.getUnit(name);
  const [value, setValue] = React.useState(engine.getSituation()[name]);

  useDebouncedEffect(
    () => {
      if (typeof value !== 'undefined') {
        engine.setField(name, value);
      }
    },
    [name, value],
    500
  );

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
        type: 'number',
        value: value ?? '',
        placeholder: isDefined(placeholder) ? `${placeholderPrecision ? placeholder.toFixed(placeholderPrecision) : placeholder}` : '',
        onChange: (e) => {
          e.stopPropagation();
          const newValue = e.target.value;
          setValue(newValue);
        },
      }}
      // state={props.state ?? fieldState.error ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? 'Sélectionnez une valeur'}
      {...props}
    />
  );
};

export default Input;
