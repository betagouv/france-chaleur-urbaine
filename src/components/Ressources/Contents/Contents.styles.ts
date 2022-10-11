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
