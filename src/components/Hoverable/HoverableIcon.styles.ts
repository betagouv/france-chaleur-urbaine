import styled from 'styled-components';

export const Container = styled.div<{ top?: string }>`
  display: inline-flex;
  position: relative;
  right: -9px;
  top: ${({ top }) => (top ? top : '3px')};
  & > .hover-info {
    width: max-content;
    max-width: 300px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;
