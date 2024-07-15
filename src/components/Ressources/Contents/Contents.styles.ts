import styled from 'styled-components';

export const Subtitle = styled.h2`
  scroll-margin: 100px;
  color: #4550e5;
  font-weight: 600;
  font-size: 28px;
  line-height: 34px;
`;

export const Source = styled.div`
  margin-top: 16px;
  font-size: 16px;
  font-weight: 400;
`;

export const List = styled.ul<{ withoutMargin?: boolean }>`
  ${({ withoutMargin }) => withoutMargin && 'margin: 0;'}
  > li {
    margin: 0 0 8px 0;
    padding-left: 24px;
    list-style: none;
    background-image: url('/img/ressources-list.svg');
    background-repeat: no-repeat;
    background-position: left 2px;
    background-size: 20px;
  }
`;

export const Statistics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  color: #4550e5;
  > div {
    width: 175px;
    text-align: center;
    > span {
      font-size: 12px;
      line-height: 12px;
    }
  }
`;

export const Statistic = styled.div`
  height: 175px;
  background-image: url('/img/ressources-livraisons.svg');
  background-size: contain;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
`;

export const CenteredImage = styled.div`
  h3,
  p {
    margin-bottom: 0;
  }
  text-align: center;
`;

export const LeftImage = styled.img`
  width: 100%;
  height: fit-content;
  margin-bottom: 32px;
`;

export const BlueText = styled.span`
  color: #4550e5;
  font-weight: bold;
`;

export const SupportImages = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  font-size: 14px;
  line-height: 16px;
  margin-bottom: 16px;

  p {
    max-width: 150px;
    margin-bottom: 0;^su
  }

  a {
    background-image: none;
    &::after {
      content: '' !important;
    }
  }
`;

export const StyledInfographieItem = styled.div<{ width: number }>`
  max-width: ${({ width }) => `${width}px;`};

  a {
    background-image: none;
    outline-width: 0;

    &:hover {
      background-color: var(--hover);
    }

    &::after {
      content: unset !important;
    }
  }
`;
