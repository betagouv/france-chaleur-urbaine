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
      width: calc(60% - 32px);
    }
  }
`;

export const BannerTitle = styled.div`
  font-size: 30px;
  line-height: 35px;
  margin-bottom: 32px;
`;

export const BannerDescription = styled.div`
  font-size: 20px;
  line-height: 24px;
`;

export const BannerImage = styled.img`
  height: 350px;
  position: absolute;
  top: 32px;
  right: 32px;
  display: none;
  @media (min-width: 992px) {
    display: block;
  }
`;
