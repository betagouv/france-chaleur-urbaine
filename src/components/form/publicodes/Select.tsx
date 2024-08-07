import { Select as DSFRSelect } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

import { usePublicodesFormContext } from './FormProvider';

export type DSFRSelectProps = React.ComponentProps<typeof DSFRSelect>;

const Select = ({
  name,
  disabled,
  onChange: onExternalChange,
  hintText: hint,
  nativeSelectProps,
  ...props
}: Omit<DSFRSelectProps, 'hint' | 'options'> & {
  name: string;
  hintText?: DSFRSelectProps['hint']; // harmonize with Input
  onChange?: (option?: string) => void;
}) => {
  const { engine } = usePublicodesFormContext();

  const options: string[] = (engine.getRule(name) as any).rawNode['une possibilité']['possibilités'].map((value: string) =>
    value.replace(/^'+|'+$/g, '')
  );
  const value = engine.getField(name);
  return (
    <DSFRSelect
      nativeSelectProps={{
        ...nativeSelectProps,
        onChange: (e) => {
          engine.setStringField(name, e.target.value);
          onExternalChange?.(e.target.value);
        },
      }}
      options={options.map((option) => ({
        label: option,
        value: option,
        selected: option === value,
      }))}
      hint={hint}
      // state={props.state ?? fieldState.error ? 'error' : 'default'}
      // stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default Select;
