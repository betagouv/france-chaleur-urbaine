import styled from 'styled-components';

export const Title = styled.p`
  font-size: 13px;
  font-weight: 500;
  font-style: italic;
  margin-bottom: 0;
`;

export const SubTitle = styled.p`
  margin-bottom: 0;
  font-size: 13px;
`;

export const Boxes = styled.div`
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
