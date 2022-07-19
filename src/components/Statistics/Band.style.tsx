import styled from 'styled-components';

type CirclePropsType = {
  color?: string;
  bgColor?: string;
};

const breakpointDesktop = 992;

export const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 8px;
  grid-auto-rows: minmax(40px, auto);

  @media (min-width: ${breakpointDesktop}px) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }
`;

export const Circle = styled.div.attrs<CirclePropsType>(
  ({ children, color, bgColor }) => ({
    children: (
      <CircleContent color={color} bgColor={bgColor}>
        {children}
      </CircleContent>
    ),
  })
)<CirclePropsType>`
  grid-column: 2/4;
`;

export const CircleContent = styled.div<CirclePropsType>`
  color: ${({ color }) => color || '#000074'};
  padding: 16px;
  background-color: ${({ bgColor }) => bgColor || '#e7e8ea'};
  font-size: 14px;
  line-height: 16px;
  font-weight: 700;
  width: 175px;
  height: 175px;
  text-align: center;
  border-radius: 50%;
  display: flex;
  gap: 24px;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  @media (min-width: ${breakpointDesktop}px) {
    margin: 8px;
  }
`;

export const Value = styled.p`
  font-size: 60px;
  margin-bottom: 0;
`;
export const Label = styled.p`
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 0;
`;

export const Equal = styled.span`
  color: #4550e5;
  font-size: 53px;

  grid-column: 2/4;
  grid-row: 2;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Separator = styled.span`
  color: #4550e5;
  font-size: 20px;
  font-weight: 700;

  grid-column: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
