import DsfrButton, { type ButtonProps as DsfrButtonProps } from '@codegouvfr/react-dsfr/Button';
import styled, { css } from 'styled-components';

type StyledButtonProps = { $loading?: boolean; $full?: boolean };

const StyledButton = styled(DsfrButton)<{ $loading?: boolean; $full?: boolean }>`
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

export type ButtonProps = DsfrButtonProps & RemoveDollar<StyledButtonProps>;

const Button: React.FC<ButtonProps> = ({ children, iconId, full, loading, ...props }) => {
  return (
    <StyledButton iconId={(loading ? 'ri-loader-3-line' : iconId || undefined) as any} $full={full} $loading={loading} {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;
