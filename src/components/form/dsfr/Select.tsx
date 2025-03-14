import DSFRSelect, { type SelectProps as DSFRSelectProps } from '@codegouvfr/react-dsfr/SelectNext';
import styled, { css } from 'styled-components';

type AdditionalSelectProps = {
  $small?: boolean;
};

const StyledDSFRSelect = styled(DSFRSelect)<AdditionalSelectProps>`
  ${({ $small }) => css`
    ${$small &&
    css`
      padding: 0.35rem 2rem 0.35rem 0.5rem;
      font-size: 0.875rem;
    `}
  `}
`;

export type SelectOption = DSFRSelectProps.Option;
export type SelectProps<Options extends SelectOption[]> = Omit<DSFRSelectProps<Options>, 'state'> &
  RemoveDollar<AdditionalSelectProps> & {
    state?: 'error' | 'default' | 'success' | 'info';
  };

const Select = <Options extends SelectOption[]>({ small, state, ...props }: SelectProps<Options>) => {
  return <StyledDSFRSelect state={state === 'success' ? 'valid' : state} $small={small} {...props} />;
};

export default Select;
