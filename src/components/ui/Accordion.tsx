import DsfrAccordion, { type AccordionProps as DsfrAccordionProps } from '@codegouvfr/react-dsfr/Accordion';
import React from 'react';

import useArrayQueryState from '@hooks/useArrayQueryState';

type UrlStateAccordionProps = Omit<DsfrAccordionProps, 'defaultExpanded' | 'expanded' | 'onExpandedChange'> & {
  useUrlState: true;
};

type AccordionProps = Omit<UrlStateAccordionProps | (DsfrAccordionProps & { useUrlState?: false }), 'label' | 'id'> &
  ({ label: string; id?: string } | { label: React.ReactNode; id: string });

const Accordion: React.FC<AccordionProps> = ({ children, useUrlState, ...props }) => {
  const { add, remove, has } = useArrayQueryState('accordions');

  const isLabelObject = typeof props.label === 'object';

  const id = isLabelObject ? (props.id as string) : (props.label as string);

  return (
    <DsfrAccordion
      {...(useUrlState
        ? {
            expanded: has(id),
            onExpandedChange: (expanded) => (expanded ? add(id) : remove(id)),
          }
        : ({} as any))}
      {...props}
    >
      {children}
    </DsfrAccordion>
  );
};

export const UrlStateAccordion = (props: AccordionProps) => <Accordion {...props} useUrlState={true} />;

export default Accordion;
