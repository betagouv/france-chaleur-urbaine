import styled from 'styled-components';

export const Container = styled.form<{ fullWidth?: boolean }>`
  ${({ fullWidth }) => !fullWidth && 'width: 500px;'}
  margin: 32px auto;
  padding: 32px;
  button {
    margin: auto;
  }
`;
