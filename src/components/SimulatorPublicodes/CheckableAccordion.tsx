// inspired from https://github.com/codegouvfr/react-dsfr/blob/9a2c192e513c4f635e4382e27a77816a08de09a7/src/Accordion.tsx
// adapted to add checkboxes

'use client';

import { fr } from '@codegouvfr/react-dsfr';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React, { forwardRef, memo, useState, useEffect, type ReactNode, type CSSProperties, useId, useRef } from 'react';
import styled from 'styled-components';
import type { Equals } from 'tsafe';
import { assert } from 'tsafe/assert';
import { Parameters } from 'tsafe/Parameters';
import { symToStr } from 'tsafe/symToStr';

import Box from '@components/ui/Box';
import cx from '@utils/cx';

// import { useConstCallback } from "./tools/powerhooks/useConstCallback";
/** https://stackoverflow.com/questions/65890278/why-cant-usecallback-always-return-the-same-ref */
export function useConstCallback<T extends ((...args: any[]) => unknown) | undefined | null>(callback: NonNullable<T>): T {
  const callbackRef = useRef<typeof callback>(null as any);

  callbackRef.current = callback;

  return useState(
    () =>
      (...args: Parameters<T>) =>
        callbackRef.current(...args)
  )[0] as T;
}

// import { useAnalyticsId } from "./tools/useAnalyticsId";
function useAnalyticsId(params: { explicitlyProvidedId?: string; defaultIdPrefix: string }) {
  const { explicitlyProvidedId, defaultIdPrefix } = params;

  const id = useId();

  return explicitlyProvidedId ?? `${defaultIdPrefix}-${id}`;
}

const StyledCheckbox = styled(Checkbox)`
  flex: 1;
  margin-bottom: 0 !important;

  & .fr-checkbox-group:first-child {
    margin-top: 0;
  }

  & .fr-accordion__title {
    font-weight: 500;
    color: var(--text-action-high-blue-france);
  }
`;

const StyledToggleButton = styled.button`
  flex: 0;
`;

export type CheckableAccordionProps = CheckableAccordionProps.Controlled | CheckableAccordionProps.Uncontrolled;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CheckableAccordionProps {
  export type Common = {
    className?: string;
    id?: string;
    titleAs?: `h${2 | 3 | 4 | 5 | 6}`;
    label: string;
    classes?: Partial<Record<'root' | 'accordion' | 'title' | 'collapse', string>>;
    style?: CSSProperties;
    children: NonNullable<ReactNode>;
  };

  export type Uncontrolled = Common & {
    defaultExpanded?: boolean;
    expanded?: never;
    onExpandedChange?: (expanded: boolean, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };

  export type Controlled = Common & {
    defaultExpanded?: never;
    expanded: boolean;
    onExpandedChange: (expanded: boolean, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };
}

/** @see <https://components.react-dsfr.codegouv.studio/?path=/docs/components-accordion>  */
export const CheckableAccordion = memo(
  forwardRef<HTMLDivElement, CheckableAccordionProps>((props, ref) => {
    const {
      className,
      id: id_props,
      titleAs: HtmlTitleTag = 'h3',
      label,
      classes = {},
      style,
      children,
      expanded: expanded_props,
      defaultExpanded = false,
      onExpandedChange,
      ...rest
    } = props;

    assert<Equals<keyof typeof rest, never>>();

    const id = useAnalyticsId({
      defaultIdPrefix: 'fr-accordion',
      explicitlyProvidedId: id_props,
    });

    const collapseElementId = `${id}-collapse`;

    const [isExpanded, setIsExpanded] = useState(expanded_props ?? defaultExpanded);

    useEffect(() => {
      if (expanded_props === undefined) {
        return;
      }

      setIsExpanded(expanded_props);
    }, [expanded_props]);

    const onExtendButtonClick = useConstCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      const isExpended_newValue = !isExpanded;

      onExpandedChange?.(isExpended_newValue, event);

      if (expanded_props === undefined) {
        setIsExpanded(isExpended_newValue);
      }
    });

    return (
      <section className={cx(fr.cx('fr-accordion'), className)} style={style} ref={ref} {...rest}>
        <Box display="flex">
          <StyledCheckbox
            options={[
              {
                label: <HtmlTitleTag className={cx(fr.cx('fr-accordion__title'), classes.title)}>{label}</HtmlTitleTag>,
                nativeInputProps: {
                  value: label,
                  onChange: (event) => {
                    console.log('checked', event.target.checked);
                  },
                },
              },
            ]}
          />

          <StyledToggleButton
            className={fr.cx('fr-accordion__btn')}
            aria-expanded={isExpanded}
            aria-controls={collapseElementId}
            onClick={onExtendButtonClick}
            title="Déplier/replier la section"
            type="button"
            id={`${id}__toggle-btn`}
          ></StyledToggleButton>
        </Box>

        <div className={cx(fr.cx('fr-collapse'), classes.collapse)} id={collapseElementId}>
          {children}
        </div>
      </section>
    );
  })
);

CheckableAccordion.displayName = symToStr({ CheckableAccordion });

export default CheckableAccordion;
