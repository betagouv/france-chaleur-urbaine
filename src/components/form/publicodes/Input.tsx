import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useDebouncedEffect } from '@react-hookz/web';
import React from 'react';

import useInViewport from '@hooks/useInViewport';
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
  const [ref, isInView] = useInViewport<HTMLDivElement>();
  const { engine } = usePublicodesFormContext();
  const placeholder = isInView ? (engine.getFieldDefaultValue(name) as number | null | undefined) : '';
  const unit = isInView ? engine.getUnit(name) : '';
  const [value, setValue] = React.useState<any>();

  React.useEffect(() => {
    if (isInView) {
      setValue(engine.getSituation()[name]);
    }
  }, [isInView]);

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
      ref={ref}
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
        placeholder: isDefined(placeholder)
          ? `${placeholderPrecision && typeof placeholder === 'number' ? placeholder.toFixed(placeholderPrecision) : placeholder}`
          : '',
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
