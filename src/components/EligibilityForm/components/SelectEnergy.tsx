import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

const HeadFormWrapper = styled.div`
  font-size: 1rem;
  padding: 0.5rem 0 0;

  label:not(:last-child) {
    margin-right: 1.5rem;
  }
`;

type CheckEligibilityFormProps = {
  name: string;
  selectOptions?: Record<string, string>;
  centredForm?: boolean;
  onChange?: (e: any) => void;
};

const SelectEnergy: React.FC<CheckEligibilityFormProps> = ({
  children,
  name,
  selectOptions = {},
  onChange,
}) => {
  const changeHandle = useCallback(
    (e: any) => {
      // console.log('change --', e.target?.value, e);
      if (onChange) onChange(e);
    },
    [onChange]
  );

  const options = useMemo(() => {
    return Object.entries(selectOptions).map(([value, label]) => (
      <label key={value}>
        <input type="radio" name={name} value={value} onChange={changeHandle} />{' '}
        {label}
      </label>
    ));
  }, [changeHandle, name, selectOptions]);

  return (
    <>
      {children}
      <HeadFormWrapper>Chauffage actuel : {options}</HeadFormWrapper>
    </>
  );
};

export default SelectEnergy;
