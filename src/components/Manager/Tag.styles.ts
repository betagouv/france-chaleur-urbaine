import styled from 'styled-components';

export const Container = styled.div<{
  colors: { color: string; backgroundColor: string };
}>`
  padding: 4px;
  font-size: 11px;
  line-height: 15px;
  border-radius: 5px;
  ${({ colors }) => `
   background-color: ${colors.backgroundColor};
   color: ${colors.color};
  `};
  font-weight: bold;
  width: max-content;
`;
