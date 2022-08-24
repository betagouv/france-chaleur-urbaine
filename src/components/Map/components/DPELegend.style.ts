import styled from 'styled-components';

export const Boxes = styled.div`
  margin-top: 8px;
  display: flex;
  gap: 4px;
`;

export const Box = styled.div<{ color: string }>`
  width: 25px;
  height: 25px;
  padding-left: 6px;
  background-color: ${({ color }) => color};
  color: white;
  font-size: 18px;
`;
