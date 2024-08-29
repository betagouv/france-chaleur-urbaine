import DsfrAccordion, { type AccordionProps as DsfrAccordionProps } from '@codegouvfr/react-dsfr/Accordion';
import React from 'react';

import useArrayQueryState from '@hooks/useArrayQueryState';

type UrlStateAccordionProps = Omit<DsfrAccordionProps, 'defaultExpanded' | 'expanded' | 'onExpandedChange'> & {
  useUrlState: true;
};

type AccordionProps = UrlStateAccordionProps | (DsfrAccordionProps & { useUrlState?: false });

const Accordion: React.FC<AccordionProps> = ({ children, label, useUrlState, ...props }) => {
  const { add, remove, has } = useArrayQueryState('accordions');

  const isLabelObject = typeof label === 'object';

  const id = isLabelObject ? (props.id as string) : (label as string);
  const shouldHaveId = useUrlState && !id;

  return (
    <DsfrAccordion
      label={
        <>
          {shouldHaveId && <span title="As label is an object, an id is required to be able to store it in the url">⚠️</span>}
          {label}
        </>
      }
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
