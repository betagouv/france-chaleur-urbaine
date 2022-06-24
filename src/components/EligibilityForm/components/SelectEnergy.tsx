import React, { useCallback, useMemo } from 'react';
import styled, { css } from 'styled-components';

type Align = 'left' | 'right';

type CheckEligibilityFormProps = {
  name: string;
  forceMobile?: boolean;
  align?: Align;
  selectOptions?: Record<string, string>;
  centredForm?: boolean;
  onChange?: (e: any) => void;
};

const HeadFormWrapper = styled.div<{ forceMobile?: boolean; align?: Align }>`
  font-size: 1rem;
  padding: 0.5rem 0 0;

  display: flex;
  flex-direction: column;
  align-items: ${({ align }) =>
    align === 'right' ? 'flex-end' : 'flex-start'};

  ${({ forceMobile }) =>
    !forceMobile &&
    css`
      @media (min-width: 480px) {
        flex-direction: row;
      }
    `}

  label {
    white-space: nowrap;

    &:not(:last-child) {
      margin-right: 1.5rem;
    }
  }
`;

const OptionWrapper = styled.span`
  display: block;

  @media (min-width: 992px) {
    display: inline;
  }
`;

const SelectEnergy: React.FC<CheckEligibilityFormProps> = ({
  children,
  name,
  forceMobile,
  align,
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
      <label key={value}>
        <input type="radio" name={name} value={value} onChange={changeHandle} />{' '}
        {label}
      </label>
    ));
  }, [changeHandle, name, selectOptions]);

  return (
    <>
      {children}
      <HeadFormWrapper forceMobile={forceMobile} align={align}>
        Chauffage actuel : <OptionWrapper>{options}</OptionWrapper>
      </HeadFormWrapper>
    </>
  );
};

export default SelectEnergy;
