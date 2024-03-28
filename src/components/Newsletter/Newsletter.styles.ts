import { TextInput } from '@codegouvfr/react-dsfr';
import styled from 'styled-components';

export const Container = styled.form`
  display: flex;
  align-items: center;
  gap: 32px;

  & .fr-alert {
    width: 534px;
  }
`;

export const Email = styled(TextInput)`
  width: 400px;
  margin-bottom: 0 !important;
`;
