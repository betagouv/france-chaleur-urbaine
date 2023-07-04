import styled from 'styled-components';

export const ImageContainer = styled.a`
  position: relative;
  display: block;
  text-decoration: none !important;
  background-image: none !important;
  line-height: 0;
  width: fit-content;
  height: fit-content;
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
