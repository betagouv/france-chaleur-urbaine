import DsfrButton, { type ButtonProps as DsfrButtonProps } from '@codegouvfr/react-dsfr/Button';
import { useRouter } from 'next/router';
import styled, { css } from 'styled-components';

type StyledButtonProps = { $loading?: boolean; $full?: boolean };

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

const Button: React.FC<ButtonProps> = ({
  children,
  iconId,
  full,
  href,
  type = 'button',
  onClick: onExternalClick,
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
    if (!onExternalClick) {
      return;
    }
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (props.disabled) {
      return;
    }

    onExternalClick?.(e);
  };

  return (
    <StyledButton
      onClick={onClick as any /** FIXME */}
      iconId={loading ? 'ri-loader-3-line' : (iconId as any) /** FIXME */}
      $full={full}
      $loading={loading}
      type={type as any /** FIXME */}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
