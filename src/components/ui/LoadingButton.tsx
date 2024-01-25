import { Button } from '@dataesr/react-dsfr';
import { ComponentProps, PropsWithChildren } from 'react';
import { Oval } from 'react-loader-spinner';
import styled from 'styled-components';
import Box from './Box';

const LoadingWrapper = styled.div<{ show: boolean }>`
  display: flex;
  justify-content: center;
  grid-column: 1/2;
  grid-row: 1/2;
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
`;

const MainWrapper = styled.div<{ show: boolean }>`
  grid-column: 1/2;
  grid-row: 1/2;
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
`;

type ButtonProps = ComponentProps<typeof Button>;

interface AsyncButtonProps extends ButtonProps {
  isLoading?: boolean;
}

/**
 * Renders a button that displays a spinner while loading.
 * Usage:
 *  <LoadingButton isLoading={isSubmitting}>Submit</LoadingButton>
 */
function LoadingButton({
  children,
  disabled,
  isLoading = false,
  ...props
}: PropsWithChildren<AsyncButtonProps>) {
  return (
    <Button
      className="fr-mt-2w"
      submit
      disabled={disabled || isLoading}
      {...props}
    >
      <Box display="grid">
        <LoadingWrapper show={isLoading}>
          <Oval
            height={24}
            width={24}
            strokeWidth={6}
            color="blue"
            secondaryColor="blue"
            visible={isLoading}
          />
        </LoadingWrapper>
        <MainWrapper show={!isLoading}>{children}</MainWrapper>
      </Box>
    </Button>
  );
}
export default LoadingButton;
