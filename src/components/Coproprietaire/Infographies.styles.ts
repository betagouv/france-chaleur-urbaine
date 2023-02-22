import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 32px;

  color: #000091;
  h2 {
    color: #4550e5;
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

export const Text = styled.div`
  width: 600px;
`;

export const Images = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  flex: 1;
  gap: 16px;
  margin-bottom: 8px;
`;

export const ImageContainer = styled.a`
  position: relative;
  text-decoration: none !important;
  line-height: 0;
  ::after {
    display: none !important;
  }

  div {
    background-color: white;
    opacity: 1;
  }

  &:hover {
    div {
      background-color: white;
      opacity: 0.8;
    }
  }
`;

export const Glass = styled.div`
  position: absolute;
  top: calc(50% - 44px);
  left: calc(50% - 44px);
  width: 88px;
  height: 88px;

  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border: 1px solid #2e4fd7;

  span {
    margin: 0 !important;
  }
`;
