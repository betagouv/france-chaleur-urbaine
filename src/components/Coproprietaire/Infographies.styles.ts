import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

export const Title = styled.div`
  width: 600px;
  margin: auto;

  h2 {
    color: #000091;
    b {
      color: #4550e5;
    }
    font-size: 33px;
    font-weight: 600;
    line-height: 51px;
  }

  h3 {
    font-size: 24px;
    font-weight: 600;
    line-height: 30px;
    color: #000074;
    b {
      color: #4550e5;
    }
  }
`;
