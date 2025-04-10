// @ts-nocheck
/* eslint-disable */
import { fr } from '@codegouvfr/react-dsfr/fr';
import { cx } from '@codegouvfr/react-dsfr/tools/cx';
import { useAnalyticsId } from '@codegouvfr/react-dsfr/tools/useAnalyticsId';
import React, { type CSSProperties, forwardRef, memo } from 'react';
import type { Equals } from 'tsafe';
import { assert } from 'tsafe/assert';
import { symToStr } from 'tsafe/symToStr';

import { Button } from './Button';
import { type ButtonProps } from './Button';

export type ButtonsGroupProps = ButtonsGroupProps.AlwaysStacked | ButtonsGroupProps.Inline;

export namespace ButtonsGroupProps {
  export type Common = {
    id?: string;
    className?: string;
    buttonsSize?: ButtonProps['size'];
    /** Default: left */
    buttonsIconPosition?: ButtonProps.WithIcon['iconPosition'];
    /* Default: "left", in vertical layout this has no effect */
    alignment?: 'left' | 'center' | 'right';
    /** Default: false */
    buttonsEquisized?: boolean;
    buttons: [ButtonProps, ...ButtonProps[]];
    style?: CSSProperties;
  };

  export type AlwaysStacked = Common & {
    /**
     * Default "never", it means that the button are
     * stacked vertically regardless of the screed width
     **/
    inlineLayoutWhen?: 'never';
    isReverseOrder?: never;
  };

  export type Inline = Omit<Common, 'alignment'> & {
    /**
     * Default "never", "never" means that the button are
     * stacked vertically regardless of the screed width
     **/
    inlineLayoutWhen?: 'always' | `${'sm' | 'md' | 'lg'} and up`;
    /** Default: false */
    isReverseOrder?: boolean;
    /* Default: "left" */
    alignment?: Common['alignment'] | 'between';
  };
}

/** @see <https://components.react-dsfr.codegouv.studio/?path=/docs/components-buttonsgroup> */
export const ButtonsGroup = memo(
  forwardRef<HTMLUListElement, ButtonsGroupProps>((props, ref) => {
    const {
      id: props_id,
      className,
      buttonsSize = 'medium',
      buttonsIconPosition = 'left',
      inlineLayoutWhen = 'never',
      alignment = 'left',
      buttonsEquisized = false,
      isReverseOrder = false,
      buttons,
      style,
      ...rest
    } = props;

    assert<Equals<keyof typeof rest, never>>();

    const id = useAnalyticsId({
      defaultIdPrefix: 'fr-btns-group',
      explicitlyProvidedId: props_id,
    });

    const buttonsGroupClassName = cx(
      fr.cx(
        'fr-btns-group',
        buttonsSize !== 'medium' &&
          `fr-btns-group--${(() => {
            switch (buttonsSize) {
              case 'small':
                return 'sm';
              case 'large':
                return 'lg';
            }
          })()}`,
        inlineLayoutWhen !== 'never' &&
          `fr-btns-group--inline${(() => {
            switch (inlineLayoutWhen) {
              case 'always':
                return '';
              case 'sm and up':
                return '-sm';
              case 'md and up':
                return '-md';
              case 'lg and up':
                return '-lg';
            }
          })()}`,
        buttonsEquisized && `fr-btns-group--equisized`,
        `fr-btns-group--${alignment}`,
        isReverseOrder && 'fr-btns-group--inline-reverse',
        `fr-btns-group--icon-${buttonsIconPosition}`
      ),
      className
    );

    return (
      <ul id={id} className={buttonsGroupClassName} style={style} ref={ref} {...rest}>
        {buttons.map((buttonProps, i) => (
          <li key={i}>
            <Button {...buttonProps} />
          </li>
        ))}
      </ul>
    );
  })
);

ButtonsGroup.displayName = symToStr({ ButtonsGroup });

export default ButtonsGroup;
