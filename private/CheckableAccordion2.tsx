import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React from 'react';
import styled from 'styled-components';

import useArrayQueryState from '@hooks/useArrayQueryState';

import Accordion, { type AccordionProps, type UrlStateAccordionProps } from './Accordion';

const StyledCheckbox = styled(Checkbox)``;
const StyledAccordion = styled(Accordion)`
  .fr-accordion__btn {
    padding-left: 0.5rem;
  }
  .fr-fieldset {
    margin: 0 -1.75rem 0.75rem -0.75rem;
  }
`;

type Checkable = {
  checked: boolean;
  onCheck: (checked: boolean) => void;
};

type UrlStateCheckableAccordionProps = Omit<
  UrlStateAccordionProps &
    Checkable & {
      queryParamName: string;
    },
  'useUrlState' | 'checked' | 'onCheck'
>;

type CheckableAccordionProps = AccordionProps & Checkable;

const CheckableAccordion2: React.FC<CheckableAccordionProps> = ({ children, checked, onCheck, label, useUrlState, ...props }) => {
  return (
    <StyledAccordion
      label={
        <>
          <StyledCheckbox
            options={[
              {
                label: '',
                nativeInputProps: {
                  checked,
                  onChange: (e) => {
                    // Do not close/open the accordion
                    e.preventDefault();
                    e.stopPropagation();

                    onCheck(e.target.checked);
                  },
                },
              },
            ]}
          />{' '}
          {label}
        </>
      }
      {...props}
    >
      {children}
    </StyledAccordion>
  );
};

export const UrlStateCheckableAccordion = ({ queryParamName, ...props }: UrlStateCheckableAccordionProps) => {
  const { add, remove, has } = useArrayQueryState(queryParamName);
  const isLabelObject = typeof props.label === 'object';

  const id = isLabelObject ? (props.id as string) : (props.label as string);

  return <CheckableAccordion useUrlState={true} checked={has(id)} onCheck={(checked) => (checked ? add(id) : remove(id))} {...props} />;
};

export default CheckableAccordion;
