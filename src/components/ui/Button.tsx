import DsfrButton, { type ButtonProps as DsfrButtonProps } from '@codegouvfr/react-dsfr/Button';
import { cva, type VariantProps } from 'class-variance-authority';
import { useRouter } from 'next/router';
import styled, { css } from 'styled-components';

import { trackEvent, type TrackingEvent } from '@/services/analytics';
import cx from '@/utils/cx';

type StyledButtonProps = {
  $loading?: boolean;
  $full?: boolean;
  variant?: 'destructive' | 'info';
  eventKey?: TrackingEvent;
  eventPayload?: string;
};

const StyledButton = styled(DsfrButton)<DsfrButtonProps & StyledButtonProps>`
  box-shadow: inset 0 0 0 1px var(--tw-shadow-color);

  ${({ $loading, $full }) => css`
    ${$loading &&
    css`
      &:before {
        animation: spin 1s linear infinite;
      }
    `}
    ${$full &&
    css`
      width: 100%;
      justify-content: center;
    `}
  `}
`;

export const variantClassNames = {
  destructive: {
    primary: '!bg-destructive !text-white !hover:bg-destructive/90',
    secondary: '!border-destructive !text-destructive shadow-destructive',
    tertiary: '!text-destructive',
  },
  info: {
    primary: '!bg-info !text-white !hover:bg-info/90',
    secondary: '!border-info !text-info shadow-info',
    tertiary: '!text-info',
  },
};

const buttonVariants = cva('', {
  variants: {
    size: {
      sm: '[&&]:!text-sm !py-0.5 !px-2 min-h-[1.5rem]',
      md: '',
      lg: '[&&]:!text-lg !py-2 !px-4 min-h-[3rem]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type ButtonProps = Omit<DsfrButtonProps, 'size'> &
  RemoveDollar<StyledButtonProps> &
  VariantProps<typeof buttonVariants> & { href?: string; stopPropagation?: boolean };

/**
 * A DSFR button component with enhanced features:
 * - Full width support via `full` prop
 * - Loading state with spinner via `loading` prop
 * - Automatic external link detection and handling
 * - Analytics event tracking via `eventKey` and `eventPayload`
 * - Stop propagation control via `stopPropagation` prop
 */

const Button: React.FC<ButtonProps> = ({
  children,
  iconId,
  full,
  href,
  type = 'button',
  disabled,
  onClick: onExternalClick,
  eventKey,
  eventPayload,
  stopPropagation,
  loading,
  variant,
  className,
  size = 'md',
  ...props
}) => {
  const router = useRouter();

  const onClick: DsfrButtonProps['onClick'] = (e) => {
    if (href) {
      if (href.startsWith('http')) {
        window.open(href, '_blank');
      } else {
        router.push(href);
      }
    }
    if (eventKey) {
      trackEvent(
        eventKey,
        eventPayload?.split(',').map((v) => v.trim())
      );
    }
    if (!onExternalClick) {
      return;
    }
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (disabled) {
      return;
    }

    onExternalClick?.(e);
  };

  let variantClassName = '';

  if (variant && !variantClassName) {
    variantClassName = (variantClassNames?.[variant] as any)?.[props?.priority || ''];
    if (!variantClassName) {
      console.warn(`Button variant ${variant} is not supported for priority ${props.priority}`);
    }
  }

  return (
    <StyledButton
      onClick={onClick as any /** FIXME cause incompatibility with DSFR Button */}
      iconId={loading ? 'ri-loader-3-line' : (iconId as any) /** FIXME */}
      $full={full}
      $loading={loading}
      variant={variant}
      disabled={(disabled || loading) as any /** FIXME cause incompatibility with DSFR Button */}
      type={type as any /** FIXME cause incompatibility with DSFR Button */}
      className={cx(variantClassName, buttonVariants({ size }), className)}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
