import DSFRSelect, { type SelectProps as DSFRSelectProps } from '@codegouvfr/react-dsfr/SelectNext';
import styled from 'styled-components';

const StyledDSFRSelect = styled(DSFRSelect)``;

export type SelectProps<Options extends DSFRSelectProps.Option[]> = DSFRSelectProps<Options>;

const Select = <Options extends DSFRSelectProps.Option[]>(props: SelectProps<Options>) => {
  return <StyledDSFRSelect {...props} />;
};

export default Select;
