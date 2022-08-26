import { Alert } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const Container = styled.form`
  width: 500px;
  margin: 32px auto;
  padding: 32px;
  button {
    margin: auto;
  }
`;

export const Password = styled.div`
  margin-top: -16px;
  margin-bottom: 16px;
  text-align: right;
  font-size: 12px;
`;

export const PasswordAlert = styled(Alert)`
  margin-bottom: 16px;
`;
