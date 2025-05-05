import DsfrButton, { type ButtonProps as DsfrButtonProps } from '@codegouvfr/react-dsfr/Button';
import { cva, type VariantProps } from 'class-variance-authority';
import { useRouter } from 'next/router';
import styled, { css } from 'styled-components';

import { trackEvent, type TrackingEvent } from '@/services/analytics';
import cx from '@/utils/cx';

type StyledButtonProps = {
  $loading?: boolean;
  $full?: boolean;
  variant?: keyof typeof variantClassNames;
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
  default: {
    primary: '',
    secondary: 'shadow-blue',
    tertiary: '',
  },
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
  faded: {
    primary: '!bg-faded !text-white !hover:bg-faded/90',
    secondary: '!border-faded !text-faded shadow-faded',
    tertiary: '!text-faded',
  },
};

const buttonVariants = cva('', {
  variants: {},
  defaultVariants: {},
});

export type ButtonProps = Omit<DsfrButtonProps, 'children'> &
  RemoveDollar<StyledButtonProps> &
  VariantProps<typeof buttonVariants> & { href?: string; stopPropagation?: boolean } & { children?: React.ReactNode };

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
  variant = 'default',
  className,
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

  const variantClassName = (variantClassNames?.[variant] as any)?.[props?.priority || 'primary'];

  if (variantClassName === undefined) {
    console.warn(`Button variant ${variant} is not supported for priority ${props.priority}`);
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
      className={cx(variantClassName, buttonVariants({}), className)}
      {...(props as any)}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
