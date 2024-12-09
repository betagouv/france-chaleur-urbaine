import styled from 'styled-components';

import Input from '@/components/form/dsfr/Input';

export const Container = styled.form`
  display: flex;
  align-items: center;
  gap: 32px;

  & .fr-alert {
    width: 534px;
  }
`;

export const Email = styled(Input)`
  width: 400px;
  margin-bottom: 0 !important;
`;
