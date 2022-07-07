import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-evenly;
`;

export const BlueCircle = styled.div`
  color: white;
  background-color: #4550e5;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
  width: 200px;
  height: 200px;
  text-align: center;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const OrangeCircle = styled.div`
  color: white;
  padding: 16px;
  background-color: #f28c00;
  font-size: 14px;
  line-height: 16px;
  font-weight: 700;
  width: 175px;
  height: 175px;
  text-align: center;
  border-radius: 50%;
  display: flex;
  gap: 16px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  p {
    font-size: 60px;
    margin-bottom: 0;
  }
`;

export const Equal = styled.span`
  color: #4550e5;
  font-size: 53px;
`;

export const Separator = styled.span`
  color: #4550e5;
  font-size: 20px;
  font-weight: 700;
`;

export const Stat = styled.span`
  text-align: center;
  width: 175px;
`;
