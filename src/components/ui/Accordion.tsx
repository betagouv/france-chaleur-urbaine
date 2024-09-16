import DsfrAccordion, { type AccordionProps as DsfrAccordionProps } from '@codegouvfr/react-dsfr/Accordion';
import styled, { css } from 'styled-components';

import useArrayQueryState from '@hooks/useArrayQueryState';

import Icon from './Icon';

const StyledAccordion = styled(DsfrAccordion)<{ $small?: boolean; $simple?: boolean; $bordered?: boolean; $closeable?: boolean }>`
  ${({ $small, $simple, $bordered, $closeable }) => css`
    ${$small &&
    css`
      .fr-accordion__btn {
        font-size: 0.875rem;
        line-height: 1.5rem;

        &:after {
          padding: 0.75rem 0.5rem;
        }
      }
    `}
    ${$bordered &&
    css`
      &:before {
        box-shadow: none;
      }
      border: 1px solid var(--border-default-grey);
      padding: 0.75rem 0.5rem;
    `}
    ${$closeable &&
    css`
      .fr-icon-close-line {
        padding: 0.25rem 0.5rem;
        margin-left: auto;
        &:hover {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
        }
      }
      .fr-accordion__btn {
        &:after {
          margin-left: 0;
        }
      }
    `}
    ${$simple &&
    css`
      border: none;
      &:before {
        box-shadow: none;
      }
      .fr-accordion__btn {
        transition: all 0.3s ease;
        padding: 0.25rem 0.1rem;
        background-color: transparent;
        min-height: 0;
      }
      .fr-collapse--expanded {
        padding: 0.75rem 0.1rem;
        margin: 0;
      }
    `}
  `}
`;

export type AccordionProps = DsfrAccordionProps & {
  small?: boolean;
  simple?: boolean;
  bordered?: boolean;
  onClose?: (evt: React.MouseEvent<HTMLElement>) => void;
};

const Accordion: React.FC<AccordionProps> = ({ children, small, label, simple, bordered, onClose, ...props }) => {
  return (
    <StyledAccordion
      $small={small}
      $simple={simple}
      $bordered={bordered}
      $closeable={!!onClose}
      label={
        <>
          {label}
          {onClose && <Icon name="fr-icon-close-line" size="sm" onClick={onClose} />}
        </>
      }
      {...props}
    >
      {children}
    </StyledAccordion>
  );
};

export type UrlStateAccordionProps = Omit<AccordionProps, 'label' | 'id' | 'onExpandedChange' | 'expanded' | 'defaultExpanded'> &
  (Pick<AccordionProps, 'label' | 'id'> | { label: React.ReactNode; id: string });

export const UrlStateAccordion = (props: UrlStateAccordionProps) => {
  const { add, remove, has } = useArrayQueryState('accordions');

  const isLabelObject = typeof props.label === 'object';

  const id = isLabelObject ? (props.id as string) : (props.label as string);

  return <Accordion {...props} expanded={has(id)} onExpandedChange={(expanded) => (expanded ? add(id) : remove(id))} />;
};

export default Accordion;
