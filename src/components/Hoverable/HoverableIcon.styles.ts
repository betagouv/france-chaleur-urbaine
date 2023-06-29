import styled from 'styled-components';

export const Container = styled.div`
  display: inline-flex;
  position: relative;
  right: -9px;
  top: 3px;
  & > .hover-info {
    width: 300px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;
