import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { Select as DSFRSelect } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

import useInViewport from '@hooks/useInViewport';

import { usePublicodesFormContext } from './FormProvider';
import { fixupBooleanEngineValue, getOptions } from './helpers';

export type DSFRSelectProps = React.ComponentProps<typeof DSFRSelect> & {
  withDefaultOption?: boolean;
};

const Select = ({
  name,
  disabled,
  onChange: onExternalChange,
  hintText: hint,
  nativeSelectProps,
  withDefaultOption = true,
  ...props
}: Omit<DSFRSelectProps, 'hint' | 'options'> & {
  name: DottedName;
  hintText?: DSFRSelectProps['hint']; // harmonize with Input
  onChange?: (option?: string) => void;
}) => {
  const [ref, isInView] = useInViewport<HTMLDivElement>();
  const { engine } = usePublicodesFormContext();

  const options = isInView ? getOptions(engine, name) : [];
  const defaultValue = isInView ? fixupBooleanEngineValue(engine.getFieldDefaultValue(name) as string | null | undefined) : '';
  const value = isInView ? (withDefaultOption ? engine.getSituation()[name] : engine.getField(name)) : undefined;

  return (
    <DSFRSelect
      ref={ref}
      nativeSelectProps={{
        ...nativeSelectProps,
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
                label: `Par défaut (${defaultValue})`,
                value: '',
              },
            ]
          : []),
        ...options.map((option) => ({
          label: option,
          value: option,
          selected: option === value,
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
