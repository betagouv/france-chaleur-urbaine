import styled from 'styled-components';

export const BannerContainer = styled.div`
  background: transparent;
  min-height: 630px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 990px) {
    margin: 0 -1rem;
    padding: 0 1rem;
    background-color: rgba(256, 256, 256, 0.8);
    background-image: linear-gradient(
      to bottom,
      transparent,
      rgb(79 173 199 / 50%)
    );
  }

  @media (max-width: 1440px) {
    background-size: cover;
    background-position: left center;
  }
`;

export const ImageContainer = styled.div`
  > img {
    width: 100%;
  }
`;
export const Container = styled.div`
  @media (min-width: 992px) {
    padding-left: 3rem;
    margin-left: 45%;
  }
`;

export const PageTitle = styled.h1`
  color: #4550e5;
  font-size: 2.815rem;
  line-height: 3rem;
  letter-spacing: -0.03rem;
`;

export const PageTitlePreTitle = styled.span`
  color: #000074;
  display: block;
  font-size: 2.06rem;
`;

export const PageTitleTeaser = styled.p.attrs({
  className: 'fr-col-lg-11',
})`
  font-size: 1.25rem;
  letter-spacing: -0.03rem;

  strong {
    color: #4550e5;
    font-weight: bold;
  }
`;
