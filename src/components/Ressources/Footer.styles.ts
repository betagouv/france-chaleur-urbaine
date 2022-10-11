import styled from 'styled-components';

export const Questions = styled.div`
  margin-bottom: 64px;
  display: flex;
  gap: 32px;
  justify-content: space-between;

  h2 {
    color: #4550e5;
  }
`;

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
  font-size: 42px;
  line-height: 52px;
  margin-bottom: 32px;
`;

export const BannerDescription = styled.div`
  font-size: 32px;
  line-height: 33px;
`;

export const BannerImage = styled.img`
  width: 40%;
  margin-top: 16px;
  position: absolute;
  bottom: -64px;
  right: 32px;
  display: none;
  @media (min-width: 992px) {
    display: block;
  }
`;
