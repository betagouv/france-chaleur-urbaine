import DsfrButton, { type ButtonProps as DsfrButtonProps } from '@codegouvfr/react-dsfr/Button';
import { useRouter } from 'next/router';
import styled, { css } from 'styled-components';

import { trackEvent, type TrackingEvent } from '@/services/analytics';

type StyledButtonProps = {
  $loading?: boolean;
  $full?: boolean;
  eventKey?: TrackingEvent;
  eventPayload?: string;
};

const StyledButton = styled(DsfrButton)<DsfrButtonProps & StyledButtonProps>`
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

export type ButtonProps = DsfrButtonProps & RemoveDollar<StyledButtonProps> & { href?: string; stopPropagation?: boolean };

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

  return (
    <StyledButton
      onClick={onClick as any /** FIXME cause incompatibility with DSFR Button */}
      iconId={loading ? 'ri-loader-3-line' : (iconId as any) /** FIXME */}
      $full={full}
      $loading={loading}
      disabled={(disabled || loading) as any /** FIXME cause incompatibility with DSFR Button */}
      type={type as any /** FIXME cause incompatibility with DSFR Button */}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
