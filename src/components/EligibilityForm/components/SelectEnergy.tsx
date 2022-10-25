import { Radio, RadioGroup } from '@dataesr/react-dsfr';
import React, { useMemo } from 'react';

type CheckEligibilityFormProps = {
  children?: React.ReactNode;
  label?: React.ReactNode;
  name: string;
  selectOptions?: Record<string, string>;
  cardMode?: boolean;
  value: string;
  onChange?: (e: any) => void;
};

const SelectEnergy: React.FC<CheckEligibilityFormProps> = ({
  children,
  label,
  name,
  cardMode,
  selectOptions = {},
  value,
  onChange,
}) => {
  const options = useMemo(() => {
    return Object.entries(selectOptions).map(([value, label]) => (
      <Radio
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: to fix in react-dsfr
        name={name}
        key={value}
        label={label}
        value={value}
        onChange={onChange}
      />
    ));
  }, [onChange, name, selectOptions]);

  return (
    <>
      {children}
      <RadioGroup
        legend={(label as string) || 'Chauffage actuel :'}
        name={name}
        isInline={!cardMode}
        required
        value={value}
      >
        {options}
      </RadioGroup>
    </>
  );
};

export default SelectEnergy;
