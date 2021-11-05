import styled from 'styled-components';

export const BannerContainer = styled.div`
  background: #f9f8f6;
`;

export const ImageContainer = styled.div`
  > img {
    width: 100%;
  }
`;
export const Container = styled.div`
  @media (min-width: 992px) {
    padding-left: 3rem;
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
