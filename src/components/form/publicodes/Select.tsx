import { type DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { Select as DSFRSelect } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

import useInViewport from '@/hooks/useInViewport';
import { isDefined } from '@/utils/core';

import { usePublicodesFormContext } from './FormProvider';
import { fixupBooleanEngineValue, fixupSituationStringValue, getOptions } from './helpers';
import Label from './Label';
import labels from './labels';

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
}: Omit<DSFRSelectProps, 'hint' | 'options' | 'label'> & {
  name: DottedName;
  hintText?: DSFRSelectProps['hint']; // harmonize with Input
  onChange?: (option?: string) => void;
  label?: keyof typeof labels | string;
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

  const displayLabel = label ? label : name in labels ? labels[name as keyof typeof labels] : name;

  return (
    <DSFRSelect
      ref={ref}
      label={<Label label={displayLabel} unit={!hideUnit ? unit : undefined} help={help} />}
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
