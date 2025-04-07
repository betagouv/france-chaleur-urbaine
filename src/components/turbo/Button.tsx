// @ts-nocheck
/* eslint-disable */
import { fr } from '@codegouvfr/react-dsfr/fr';
import type { FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr/fr/generatedFromCss/classNames';
// import { getLink } from '@codegouvfr/react-dsfr/link';

import type { RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import { cx } from '@codegouvfr/react-dsfr/tools/cx';
import { useAnalyticsId } from '@codegouvfr/react-dsfr/tools/useAnalyticsId';
import React, {
  type ComponentProps,
  type CSSProperties,
  forwardRef,
  type ForwardRefExoticComponent,
  memo,
  type MemoExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react';
import type { Equals } from 'tsafe';
import { assert } from 'tsafe/assert';
import { symToStr } from 'tsafe/symToStr';

import Link from '@/components/ui/Link';

export type ButtonProps = ButtonProps.Common &
  (ButtonProps.IconOnly | ButtonProps.WithIcon | ButtonProps.WithoutIcon) &
  (ButtonProps.AsAnchor | ButtonProps.AsButton);
export namespace ButtonProps {
  export type Common = {
    id?: string;
    className?: string;
    /** Default primary */
    priority?: 'primary' | 'secondary' | 'tertiary' | 'tertiary no outline';
    /** Default medium */
    size?: 'small' | 'medium' | 'large';
    style?: CSSProperties;
  };

  export type IconOnly = {
    children?: never;
    /** Function of the button */
    title: string;
    iconId: FrIconClassName | RiIconClassName;
    iconPosition?: never;
  };

  export type WithIcon = {
    children: ReactNode;
    /** Function of the button, to provide if the label isn't explicit */
    title?: string;
    iconId: FrIconClassName | RiIconClassName;
    /** Default left */
    iconPosition?: 'left' | 'right';
  };

  export type WithoutIcon = {
    children: ReactNode;
    /** Function of the button, to provide if the label isn't explicit */
    title?: string;
    iconId?: never;
    iconPosition?: never;
  };

  export type AsAnchor = {
    linkProps: RegisteredLinkProps;
    onClick?: never;
    nativeButtonProps?: never;
    disabled?: never;
    type?: never;
    value?: never;
  };
  export type AsButton = {
    linkProps?: never;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    nativeButtonProps?: ComponentProps<'button'> & Record<`data-${string}`, string | boolean | null | undefined>;
    disabled?: boolean;
    /** Default "button" */
    type?: 'button' | 'submit' | 'reset';
    value?: string;
  };
}

/** @see <https://components.react-dsfr.codegouv.studio/?path=/docs/components-button> */
export const Button = memo(
  forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
    const {
      id: props_id,
      className: prop_className,
      children,
      title,
      iconId,
      iconPosition = 'left',
      priority = 'primary',
      size = 'medium',
      linkProps,
      onClick,
      nativeButtonProps,
      disabled,
      type,
      style,
      value,
      ...rest
    } = props;

    assert<Equals<keyof typeof rest, never>>();

    const id = useAnalyticsId({
      defaultIdPrefix: 'fr-button',
      explicitlyProvidedId: props_id,
    });

    // const { Link } = getLink();

    const className = cx(
      fr.cx(
        'fr-btn',
        priority !== 'primary' && `fr-btn--${priority === 'tertiary no outline' ? 'tertiary-no-outline' : priority}`,
        size !== 'medium' &&
          `fr-btn--${(() => {
            switch (size) {
              case 'small':
                return 'sm';
              case 'large':
                return 'lg';
            }
          })()}`,
        ...(iconId === undefined ? [] : [iconId, children !== undefined && (`fr-btn--icon-${iconPosition}` as const)])
      ),
      linkProps !== undefined && linkProps.className,
      prop_className
    );

    return linkProps !== undefined ? (
      <Link
        {...linkProps}
        id={props_id ?? linkProps.id ?? id}
        title={title ?? linkProps.title}
        className={cx(linkProps?.className, className)}
        style={{
          ...linkProps?.style,
          ...style,
        }}
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        {...rest}
      >
        {children}
      </Link>
    ) : (
      <button
        {...nativeButtonProps}
        id={props_id ?? nativeButtonProps?.id ?? id}
        className={cx(nativeButtonProps?.className, className)}
        style={{
          ...nativeButtonProps?.style,
          ...style,
        }}
        type={type ?? nativeButtonProps?.type}
        title={title ?? nativeButtonProps?.title}
        onClick={onClick ?? nativeButtonProps?.onClick}
        disabled={disabled ?? nativeButtonProps?.disabled}
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        value={value}
        {...rest}
      >
        {children}
      </button>
    );
  })
) as MemoExoticComponent<
  ForwardRefExoticComponent<
    ButtonProps.Common &
      (ButtonProps.IconOnly | ButtonProps.WithIcon | ButtonProps.WithoutIcon) &
      ((ButtonProps.AsAnchor & RefAttributes<HTMLAnchorElement>) | (ButtonProps.AsButton & RefAttributes<HTMLButtonElement>))
  >
>;

Button.displayName = symToStr({ Button });

export default Button;
