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
  const [error, setError] = React.useState<string>();
  const { min, max } = nativeInputProps || {};

  React.useEffect(() => {
    if (isInView) {
      setValue(engine.getSituation()[name]);
    }
  }, [isInView, engine.getSituation()[name]]);

  useDebouncedEffect(
    () => {
      if (
        (typeof value === 'undefined' ||
          (isDefined(min) && isDefined(max) && (+value < +min || +value > +max)) ||
          (isDefined(min) && +value < +min) ||
          (isDefined(max) && +value > +max)) &&
        value !== ''
      ) {
        return;
      }
      engine.setField(name, value);
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
          setError(undefined);
          e.stopPropagation();
          const newValue = e.target.value;

          if (!newValue) {
            setValue(newValue);
            return;
          }

          const minString = unit === '%' && min ? min.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 }) : min;
          const maxString = unit === '%' && max ? max.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 }) : max;

          if (isDefined(min) && isDefined(max) && (+newValue < +min || +newValue > +max)) {
            setError(`Veuillez saisir une valeur comprise entre ${minString} et ${maxString}`);
          } else if (isDefined(min) && +newValue < +min) {
            setError(`Veuillez saisir une valeur supérieure ou égale à ${minString}`);
          } else if (isDefined(max) && +newValue > +max) {
            setError(`Veuillez saisir une valeur inférieure ou égale à ${maxString}`);
          }
          setValue(newValue);
        },
      }}
      state={props.state ?? error ? 'error' : 'default'}
      stateRelatedMessage={props.stateRelatedMessage ?? (error || 'Sélectionnez une valeur')}
      {...props}
    />
  );
};

export default Input;
