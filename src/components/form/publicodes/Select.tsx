import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { Select as DSFRSelect } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

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
  const { engine } = usePublicodesFormContext();

  const options = getOptions(engine, name);
  const valueInEngine = fixupBooleanEngineValue(engine.getField(name));
  console.log(name, valueInEngine);
  return (
    <DSFRSelect
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
                label: `Par défaut (${valueInEngine})`,
                value: '',
              },
            ]
          : []),
        ...options.map((option) => ({
          label: option,
          value: option,
          selected: option === valueInEngine,
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
