import styled from 'styled-components';

export const Container = styled.div<{ width?: number }>`
  width: ${({ width }) => width || 100}px;
`;
