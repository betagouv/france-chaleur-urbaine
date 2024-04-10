import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import { Select, TextInput } from '@dataesr/react-dsfr';
import styled, { css } from 'styled-components';

export const BoxSimulator = styled(Cartridge)`
  width: 500px;
  padding: 32px;
`;

export const SimulatorResult = styled(Cartridge)`
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 15px;
  line-height: 15px;
`;

export const BigResult = styled.span`
  margin-right: 8px;
  font-size: 44px;
  font-weight: 600;
  line-height: 21px;
`;

export const SmallResult = styled.span`
  margin-right: 8px;
  font-size: 24px;
  font-weight: 600;
  line-height: 21px;
`;

export const Separator = styled.div`
  height: 80px;
  border-right: solid 1px white;
`;

export const SurfSelect = styled(Select)`
  margin-right: 32px;
  max-width: 300px;
`;

export const Input = styled(TextInput)`
  display: inline-block;
  width: calc(100% - 30px);
  &:not(first-child) {
    margin-left: 8px;
  }
`;

export const CartridgeSimulatorForm = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  fieldset {
    border: none;
    text-align: right;

    select {
      margin-bottom: 8px;
    }
  }
`;

export const CartridgeSimulatorFooter = styled.div`
  margin: 4px 16px 8px 16px;
  font-size: 11px;
  line-height: 13px;
`;

const breakPoint = '1050px';

export const Container = styled.div<{ custom: boolean }>`
  display: flex;
  flex-direction: column;

  @media (min-width: ${breakPoint}) {
    flex-direction: row;
  }
  ${({ custom }) =>
    custom &&
    css`
      color: #4550e5;
      margin: auto;
      background-color: #f9f8f6;
      border: 1px solid #e7e7e7;
      border-radius: 40px;
      padding: 32px;
    `}
`;

export const ContainerBody = styled.div`
  flex: 2;
  position: relative;
  padding-top: 32px;
  &:after {
    content: '';
    display: block;
    position: absolute;

    top: 0;
    left: 0;
    right: 0;

    width: auto;
    height: 1px;
    background-color: currentColor;
  }

  @media (min-width: ${breakPoint}) {
    padding-top: unset;
    padding-bottom: unset;
    padding-left: 32px;
    &:after {
      right: unset;
      top: 0;
      bottom: 0;

      width: 1px;
      height: auto;
    }
  }
`;

export const SimulatorFormResult = styled.div<{
  inline?: boolean;
}>`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 0.55em;
  max-width: calc(230px + 0.55em);

  @media (min-width: 992px) {
    margin-left: 3em;
  }

  ${({ inline }) =>
    inline &&
    css`
      width: auto;
      margin-left: 0em;
      flex-wrap: nowrap;
      max-width: none;
      justify-content: stretch;
      align-items: stretch;

      @media (min-width: 992px) {
        flex-direction: row;
      }
    `}

  & > .cartridge {
    font-size: 0.95rem;
    line-height: 1.2;
    padding: 1em;

    ${({ inline }) =>
      inline
        ? css`
            flex: 1;
            margin: 0 0.5em;
          `
        : css`
            &:not(:last-child) {
              margin-bottom: 1em;
            }
          `}
  }
  .simulator-result-economy {
    .simulator-result-economy__result {
      display: flex;
      flex-direction: row;
      justify-content: stretch;
      align-items: center;

      strong {
        display: block;
        width: 3em;
        font-size: 2.95em;
        padding: 0 0.2em 0 0;
        line-height: 1;
        text-align: right;
      }
    }

    .simulator-result-economy__tips {
      clear: both;
      margin-top: 1em;
      padding-top: 1em;
      border-top: 1px solid #ffffff64;
      display: flex;
      align-items: center;
      justify-content: stretch;
      font-size: 0.75rem;

      strong.tonne {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-size: 0.7rem;

        em {
          font-style: normal;
          font-weight: bold;
          font-size: 3.25em;
          height: 1em;
          line-height: 1;
          margin-top: -0.15em;
        }
      }
      strong.equal {
        min-width: 1.5em;
        display: inline-block;
        text-align: center;
        font-size: 1.5rem;
      }
    }
  }

  .simulator-result-reduction {
    font-size: 0.75rem;

    @media (max-width: 991px) {
      margin-top: 1em;
    }

    @media (min-width: 992px) {
      display: flex;
      flex-direction: column;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    ${({ inline }) =>
      inline &&
      css`
        flex-direction: column;
        justify-content: center;
      `}

    strong {
      font-weight: normal;
      font-size: 1.5rem;
      padding: 0 0.2em 0 0;
      line-height: 1;
      text-align: right;

      @media (max-width: 991px) {
        float: left;
      }

      @media (min-width: 992px) {
        width: 4em;
      }
    }
  }
`;

export const SimulatorWrapper = styled.div<{ withPadding: boolean }>`
  flex: 3;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  ${({ withPadding }) =>
    withPadding &&
    css`
      padding-bottom: 1.5em;

      @media (min-width: ${breakPoint}) {
        padding-bottom: unset;
        padding-right: 3em;
      }
    `}
`;

export const SimulatorHeader = styled.p`
  font-size: 1.25em;
`;

export const SimulatorFormWrapper = styled.div`
  width: 100%;
  align-items: flex-start;
  max-width: 700px;
  display: flex;
  flex-direction: column;

  @media (min-width: 992px) {
    flex-direction: row;
  }

  @media (min-width: ${breakPoint}) {
    max-width: none;
    align-self: unset;
  }
`;

export const SimulatorForm = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (min-width: 992px) {
    flex: 1;
  }

  fieldset {
    padding: 0;
    border: none;
    margin: 0 0 0.75em 0;
    text-align: right;

    &:last-child {
      margin: 0;
    }

    div {
      display: inline-block;
    }

    input {
      min-width: 250px;
      max-width: 350px;
    }

    select {
      min-width: 280px;
      max-width: 400px;
      margin-bottom: 8px;
    }
  }
`;

export const SimulatorFooter = styled.div`
  max-width: fit-content;
  padding-top: 1.5rem;
  font-size: 0.7em;
  line-height: 1.25;
`;
