import { Button } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const Container = styled.div<{
  withMargin?: boolean;
  cartridge?: boolean;
}>`
  ${({ cartridge }) =>
    cartridge
      ? `
          background-color: rgba(205, 227, 240, 0.2);;
          width: 450px;
          border-radius: 0.7em;
        `
      : 'background-color: #4550e5'}
  color: white;
  h4 {
    color: white;
  }
  padding: 32px;
  ${({ withMargin }) =>
    withMargin &&
    `
  margin: 32px 0;
  @media (min-width: 576px) {
    margin: 32px 0 32px 64px;
  }
  `}
`;

export const Title = styled.div`
  margin: auto;
  font-size: 28px;
  font-weight: 700;
  line-height: 34px;
  max-width: 950px;
`;

export const Form = styled.div<{
  cartridge?: boolean;
}>`
  ${({ cartridge }) =>
    !cartridge &&
    `
      display: flex;
      align-items: flex-start;
      justify-content: center;
      flex-wrap: wrap;
      gap: 32px;
      margin: 32px;
  `}
`;

export const Inputs = styled.div<{
  cartridge?: boolean;
}>`
  padding-top: 11px;
  height: 125px;
  ${({ cartridge }) =>
    cartridge &&
    `
      width: 100%;
      .fr-select-group {
        margin-bottom: 16px !important;
      }
  `}

  input {
    min-width: 225px;
  }
`;

export const Result = styled.div<{
  cartridge?: boolean;
}>`
  width: fit-content;
  background-color: #efc73f;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  font-size: 24px;
  font-weight: 700;
  margin: auto;
  @media (min-width: 450px) {
    min-width: 300px;
  }
  height: 125px;
  ${({ cartridge }) =>
    cartridge &&
    `
    color: #4550e5;
  `}
`;

export const Disclaimer = styled.div<{
  cartridge?: boolean;
}>`
  margin-top: 8px;
  max-width: 400px;
  ${({ cartridge }) =>
    cartridge &&
    `
      font-size: 11px;
      line-height: 13px;
      max-width: 100%;
    `}
`;

export const ResultValue = styled.div`
  font-size: 44px;
`;

export const RedirectionButton = styled(Button)`
  margin: auto;
  display: block !important;
  margin-top: 32px;
`;
