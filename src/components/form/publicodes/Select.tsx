import { type DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { Select as DSFRSelect } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

import useInViewport from '@/hooks/useInViewport';
import { isDefined } from '@/utils/core';

import { usePublicodesFormContext } from './FormProvider';
import { fixupBooleanEngineValue, fixupSituationStringValue, getOptions } from './helpers';
import Label from './Label';

export type DSFRSelectProps = React.ComponentProps<typeof DSFRSelect> & {
  withDefaultOption?: boolean;
  hideUnit?: boolean;
  help?: React.ReactNode;
};

const Select = ({
  name,
  onChange: onExternalChange,
  hintText: hint,
  label,
  help,
  hideUnit = false,
  nativeSelectProps,
  withDefaultOption = true,
  ...props
}: Omit<DSFRSelectProps, 'hint' | 'options'> & {
  name: DottedName;
  hintText?: DSFRSelectProps['hint']; // harmonize with Input
  onChange?: (option?: string) => void;
}) => {
  const [ref, isInViewRaw] = useInViewport<HTMLDivElement>();
  const isInView =
    !ref.current || // Hack because when Select value reveals another Select, ref is null and thus not in view
    isInViewRaw;
  const { engine } = usePublicodesFormContext();
  const unit = !hideUnit && isInView ? engine.getUnit(name) : '';

  const options = isInView ? getOptions(engine, name) : [];
  const defaultValue = isInView ? fixupBooleanEngineValue(engine.getFieldDefaultValue(name) as string | null | undefined) : '';
  const value = isInView
    ? `${
        (withDefaultOption ? fixupSituationStringValue(engine.getSituation()[name]) : fixupBooleanEngineValue(engine.getField(name))) ?? ''
      }`
    : '';

  return (
    <DSFRSelect
      ref={ref}
      label={<Label label={label} unit={!hideUnit ? unit : undefined} help={help} />}
      nativeSelectProps={{
        ...nativeSelectProps,
        value,
        onChange: (e) => {
          const value = e.target.value;
          if (['oui', 'non'].includes(value)) {
            engine.setField(name, value);
          } else {
            engine.setStringField(name, value);
          }
          onExternalChange?.(value);
        },
      }}
      options={[
        ...(withDefaultOption
          ? [
              {
                label: `Par défaut${isDefined(defaultValue) ? ` (${defaultValue})` : ''}`,
                value: '',
              },
            ]
          : []),
        ...options.map((option) => ({
          label: option,
          value: option,
        })),
      ]}
      hint={hint}
      // state={props.state ?? fieldState.error ? 'error' : 'default'}
      // stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default Select;
