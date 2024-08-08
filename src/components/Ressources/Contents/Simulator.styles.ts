import { Button } from '@codegouvfr/react-dsfr/Button';
import styled from 'styled-components';

export const Container = styled.div<{
  withMargin?: boolean;
  cartridge?: boolean;
  withRedirection?: boolean;
  backgroundColor?: string;
}>`
  ${({ cartridge, withRedirection, backgroundColor }) =>
    cartridge
      ? `
          background-color:  ${backgroundColor ? backgroundColor : withRedirection ? '#4550e5' : 'var(--blue-france-975-75)'};
          max-width: 450px;
          border-radius: 0.7em;
        `
      : 'background-color: #4550e5;'}
  color: white;
  h4 {
    color: white;
  }
  padding: 16px;
  ${({ withMargin, theme }) =>
    withMargin &&
    `
  margin: 32px 0;
  ${theme.media.sm`
    margin: 32px 0 32px 64px;
  `}
  `}
`;

export const Title = styled.div`
  margin: 0 auto 16px auto;
  font-size: 20px;
  font-weight: 700;
  line-height: 25px;
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
  backgroundColor?: string;
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

  .fr-select, .fr-input {
    ${({ backgroundColor }) =>
      backgroundColor &&
      `background-color:  ${backgroundColor};
    `}
  }

  input {
    min-width: 225px;
  }
`;

export const Result = styled.div<{
  cartridge?: boolean;
  color?: string;
  backgroundColor?: string;
}>`
  width: 100%;
  background-color: #27a658;
  ${({ backgroundColor }) => (backgroundColor ? `background-color: ${backgroundColor};` : `background-color: #27a658;`)}
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  font-size: 20px;
  margin: auto;
  @media (min-width: 450px) {
    min-width: 300px;
  }
  height: 125px;
  ${({ cartridge, color }) => (color || cartridge) && (color ? `color: ${color};` : `color: #fff;`)}
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
  font-weight: 700;
`;

export const RedirectionButton = styled(Button)`
  margin: auto;
  display: block !important;
  margin-top: 32px;
`;
