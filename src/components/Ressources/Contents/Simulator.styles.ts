import styled from 'styled-components';

export const Container = styled.div`
  background-color: #4550e5;
  color: white;
  padding: 32px;
  margin: 32px 0 32px 64px;
`;

export const Title = styled.div`
  font-size: 28px;
  font-weight: 700;
  line-height: 34px;
`;

export const Form = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 32px;
  margin: 32px;
`;

export const Inputs = styled.div`
  padding-top: 11px;
  height: 125px;
  input {
    min-width: 225px;
  }
`;

export const Result = styled.div`
  background-color: #efc73f;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  font-size: 24px;
  font-weight: 700;
  min-width: 300px;
  height: 125px;
`;

export const ResultValue = styled.div`
  font-size: 44px;
`;
