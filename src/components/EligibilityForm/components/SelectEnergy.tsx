import { Radio, RadioGroup } from '@dataesr/react-dsfr';
import React, { useCallback, useMemo } from 'react';

type CheckEligibilityFormProps = {
  children?: React.ReactNode;
  label?: React.ReactNode;
  name: string;
  selectOptions?: Record<string, string>;
  cardMode?: boolean;
  onChange?: (e: any) => void;
};

const SelectEnergy: React.FC<CheckEligibilityFormProps> = ({
  children,
  label,
  name,
  cardMode,
  selectOptions = {},
  onChange,
}) => {
  const changeHandle = useCallback(
    (e: any) => {
      if (onChange) onChange(e);
    },
    [onChange]
  );

  const options = useMemo(() => {
    return Object.entries(selectOptions).map(([value, label]) => (
      <Radio
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: to fix in react-dsfr
        name={name}
        key={value}
        label={label}
        value={value}
        onChange={changeHandle}
      />
    ));
  }, [changeHandle, name, selectOptions]);

  return (
    <>
      {children}
      <RadioGroup
        legend={(label as string) || 'Chauffage actuel :'}
        name={name}
        isInline={!cardMode}
        required
      >
        {options}
      </RadioGroup>
    </>
  );
};

export default SelectEnergy;
