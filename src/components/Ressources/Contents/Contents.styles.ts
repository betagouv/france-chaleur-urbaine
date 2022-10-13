import styled from 'styled-components';

export const Subtitle = styled.h2`
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
  li {
    margin: 0;
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

export const LeftImage = styled.img`
  width: 100%;
  height: fit-content;
  margin-bottom: 32px;
`;
