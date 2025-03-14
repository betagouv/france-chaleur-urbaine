import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';
import React from 'react';

type SelectEnergyProps = {
  children?: React.ReactNode;
  label?: React.ReactNode;
  name: string;
  selectOptions?: Record<string, string>;
  cardMode?: boolean;
  value: string;
  onChange: (e: any) => void;
  className?: string;
};

const SelectEnergy = ({ children, label, name, cardMode, selectOptions = {}, value, onChange, className }: SelectEnergyProps) => {
  return (
    <>
      {children}
      <RadioButtons
        legend={typeof label === 'string' ? (label ?? 'Chauffage actuel ') : label}
        name={name}
        className={className}
        orientation={cardMode ? 'vertical' : 'horizontal'}
        options={Object.entries(selectOptions).map(([optionValue, label]) => ({
          label: label,
          nativeInputProps: {
            checked: value === optionValue,
            onChange: () => {
              onChange(optionValue);
            },
          },
        }))}
      />
    </>
  );
};

export default SelectEnergy;
