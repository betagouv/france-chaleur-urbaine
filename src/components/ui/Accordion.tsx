import DsfrAccordion, { type AccordionProps as DsfrAccordionProps } from '@codegouvfr/react-dsfr/Accordion';
import React from 'react';
import styled from 'styled-components';

import useArrayQueryState from '@hooks/useArrayQueryState';

export type UrlStateAccordionProps = Omit<DsfrAccordionProps, 'defaultExpanded' | 'expanded' | 'onExpandedChange'> & {
  useUrlState: true;
};

const StyledAccordion = styled(DsfrAccordion)<{ $small?: boolean }>`
  ${({ $small }) =>
    $small &&
    `
  .fr-accordion__btn {
    font-size: 0.875rem;
    line-height: 1.5rem;

    &:after {
      padding: 0.75rem 0.5rem;;
    }
  }
`}
`;

export type AccordionProps = Omit<UrlStateAccordionProps | (DsfrAccordionProps & { useUrlState?: false }), 'label' | 'id'> &
  (Pick<DsfrAccordionProps, 'label' | 'id'> | { label: React.ReactNode; id: string; useUrlState: true }) & { small?: boolean };

const Accordion: React.FC<AccordionProps> = ({ children, useUrlState, small, ...props }) => {
  const { add, remove, has } = useArrayQueryState('accordions');

  const isLabelObject = typeof props.label === 'object';

  const id = isLabelObject ? (props.id as string) : (props.label as string);

  return (
    <StyledAccordion
      $small={small}
      {...(useUrlState
        ? {
            expanded: has(id),
            onExpandedChange: (expanded) => (expanded ? add(id) : remove(id)),
          }
        : ({} as any))}
      {...props}
    >
      {children}
    </StyledAccordion>
  );
};

export const UrlStateAccordion = (props: AccordionProps) => <Accordion {...props} useUrlState={true} />;

export default Accordion;
