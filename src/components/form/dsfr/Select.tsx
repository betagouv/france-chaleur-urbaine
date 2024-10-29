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

export type SelectProps<Options extends DSFRSelectProps.Option[]> = DSFRSelectProps<Options> & RemoveDollar<AdditionalSelectProps>;

const Select = <Options extends DSFRSelectProps.Option[]>({ small, ...props }: SelectProps<Options>) => {
  return <StyledDSFRSelect $small={small} {...props} />;
};

export default Select;
