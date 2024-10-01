import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useDebouncedEffect } from '@react-hookz/web';
import React from 'react';

import useInViewport from '@hooks/useInViewport';
import { isDefined } from '@utils/core';
import { upperCaseFirstChar } from '@utils/strings';

import DSFRInput from '../dsfr/Input';
import { usePublicodesFormContext } from '../publicodes/FormProvider';
export type DSFRInputProps = React.ComponentProps<typeof DSFRInput>;

type InputProps = DSFRInputProps &
  Omit<DSFRInputProps, 'nativeTextAreaProps'> & {
    textArea?: false;
    placeholderPrecision?: number;
    name: DottedName;
    label: string;
    hideUnit?: boolean;
  };

const Input = ({ name, placeholderPrecision, textArea, nativeInputProps, label, hideUnit = false, ...props }: InputProps) => {
  const [ref, isInView] = useInViewport<HTMLDivElement>();
  const { engine } = usePublicodesFormContext();
  const placeholder = isInView ? (engine.getFieldDefaultValue(name) as number | null | undefined) : '';
  const unit = !hideUnit && isInView ? engine.getUnit(name) : '';
  const [value, setValue] = React.useState<any>();

  React.useEffect(() => {
    if (isInView) {
      setValue(engine.getSituation()[name]);
    }
  }, [isInView, engine.getSituation()[name]]);

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
          {!hideUnit && unit ? <small> ({unit})</small> : ''}
        </>
      }
      hideOptionalLabel
      nativeInputProps={{
        ...nativeInputProps,
        type: 'number',
        value: value ?? '',
        placeholder: isDefined(placeholder)
          ? `${
              isDefined(placeholderPrecision) && typeof placeholder === 'number' ? placeholder.toFixed(placeholderPrecision) : placeholder
            }`
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
