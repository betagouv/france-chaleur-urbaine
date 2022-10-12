import styled from 'styled-components';

export const Banner = styled.div`
  position: relative;
  background-color: #e7ebfc;
  padding: 64px;
  margin: 32px;
  gap: 16px;
  color: #4550e5;
  font-weight: 400;
  @media (min-width: 992px) {
    div {
      width: calc(70% - 32px);
    }
  }
`;

export const BannerTitle = styled.div`
  font-size: 38px;
  line-height: 42px;
  margin-bottom: 32px;
`;

export const BannerDescription = styled.div`
  font-size: 28px;
  line-height: 30px;
`;

export const BannerImage = styled.img`
  width: 30%;
  margin-top: 16px;
  position: absolute;
  bottom: -64px;
  right: 32px;
  display: none;
  @media (min-width: 992px) {
    display: block;
  }
`;
