import { Alert } from '@codegouvfr/react-dsfr/Alert';
import styled from 'styled-components';

export const Container = styled.form<{ fullWidth?: boolean }>`
  ${({ fullWidth }) => !fullWidth && 'width: 500px;'}
  margin: 32px auto;
  padding: 32px;
  button {
    margin: auto;
  }
`;

export const PasswordInput = styled.div`
  position: relative;
`;

export const PasswordIcon = styled.div`
  cursor: pointer;
  bottom: 9px;
  position: absolute;
  right: 9px;
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
