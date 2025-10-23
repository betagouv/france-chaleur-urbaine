import DsfrAccordion, { type AccordionProps as DsfrAccordionProps } from '@codegouvfr/react-dsfr/Accordion';
import { useQueryState } from 'nuqs';
import styled, { css } from 'styled-components';

import Tooltip from '@/components/ui/Tooltip';
import useArrayQueryState from '@/hooks/useArrayQueryState';
import type { Partialize } from '@/utils/typescript';

import Icon from './Icon';

const StyledAccordion = styled(DsfrAccordion)<{
  $small?: boolean;
  $simple?: boolean;
  $bordered?: boolean;
  $closeable?: boolean;
  $disabled?: boolean;
}>`
  ${({ $small, $simple, $bordered, $closeable, $disabled }) => css`
    overflow: visible;
    ${
      $disabled &&
      css`
      opacity: 0.5;
      pointer-events: none;
    `
    }
    ${
      $small &&
      css`
      .fr-collapse--expanded {
        padding: 0.5rem;
      }
      .fr-accordion__btn {
        font-size: 0.875rem;
        line-height: 1.5rem;

        &:after {
          padding: 0.75rem 0.5rem;
        }
      }
    `
    }
    ${
      $bordered &&
      css`
      &:before {
        box-shadow: none;
      }
      border: 1px solid var(--border-default-grey);
      ${
        $small
          ? css`
            padding: 0;
            .fr-accordion__btn {
              padding: 0.5rem 0.5rem;
            }
          `
          : css`
          padding: 0.75rem 0.5rem;
          `
      }
    `
    }
    ${
      $closeable &&
      css`
      .fr-icon-close-line {
        padding: 0.25rem 0.5rem;

        &:hover {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
        }
      }
      .fr-accordion__btn {
        &:after {
          margin-left: 0;
        }
      }
    `
    }
    ${
      $simple &&
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
    `
    }
  `}
`;

const AccordionTitleHelp = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
`;

export type AccordionProps = DsfrAccordionProps & {
  small?: boolean;
  simple?: boolean;
  bordered?: boolean;
  disabled?: boolean;
  help?: React.ReactNode;
  onClose?: (evt: React.MouseEvent<HTMLElement>) => void;
};

const Accordion: React.FC<AccordionProps> = ({ children, small, label, help, simple, bordered, onClose, disabled, ...props }) => {
  return (
    <StyledAccordion
      $small={small}
      $simple={simple}
      $disabled={disabled}
      $bordered={bordered}
      $closeable={!!onClose || !!help}
      label={
        <>
          {label}
          {(help || onClose) && (
            <AccordionTitleHelp>
              {help && <Tooltip title={help} />}
              {onClose && (
                <Icon
                  name="fr-icon-close-line"
                  size="sm"
                  onClickCapture={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose(e);
                  }}
                />
              )}
            </AccordionTitleHelp>
          )}
        </>
      }
      {...props}
    >
      {children}
    </StyledAccordion>
  );
};

export type UrlStateAccordionProps = Partialize<Omit<AccordionProps, 'label' | 'id' | 'expanded' | 'defaultExpanded'>, 'onExpandedChange'> &
  (Pick<AccordionProps, 'label' | 'id'> | { label: React.ReactNode; id: string }) &
  (
    | {
        queryParamName?: string;
        id?: string;
        multi: false;
      }
    | {
        queryParamName?: string;
        multi?: true;
      }
  );

export const UrlStateAccordion = ({ multi = true, queryParamName = 'accordions', onExpandedChange, ...props }: UrlStateAccordionProps) => {
  const { add, remove, has } = useArrayQueryState(queryParamName);
  const [value, setValue] = useQueryState(queryParamName);

  const isLabelObject = typeof props.label === 'object';

  const id = isLabelObject || props.id ? (props.id as string) : (props.label as string);

  const expanded = multi ? has(id) : value === id;

  const onExpandedChangeUrlState = multi
    ? (expanded: boolean) => (expanded ? add(id) : remove(id))
    : (expanded: boolean) => (expanded ? setValue(id) : setValue(null));

  return (
    <Accordion
      {...props}
      expanded={expanded}
      onExpandedChange={(newExpanded, e) => {
        onExpandedChangeUrlState(newExpanded);
        onExpandedChange?.(newExpanded, e);
      }}
    />
  );
};

export default Accordion;
