import DsfrButton, { type ButtonProps as DsfrButtonProps } from '@codegouvfr/react-dsfr/Button';
import { useRouter } from 'next/router';
import styled, { css } from 'styled-components';

import cx from '@/utils/cx';

type StyledButtonProps = { $loading?: boolean; $full?: boolean; variant?: 'destructive' };

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
  },
};

export type ButtonProps = DsfrButtonProps & RemoveDollar<StyledButtonProps> & { href?: string; stopPropagation?: boolean };

const Button: React.FC<ButtonProps> = ({
  children,
  iconId,
  full,
  href,
  type = 'button',
  disabled,
  onClick: onExternalClick,
  stopPropagation,
  loading,
  variant,
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
      disabled={(disabled || loading) as any /** FIXME cause incompatibility with DSFR Button */}
      type={type as any /** FIXME cause incompatibility with DSFR Button */}
      className={cx(variantClassName, className)}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
