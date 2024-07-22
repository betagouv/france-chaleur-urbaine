import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import styled, { css } from 'styled-components';

import DSFRInput from '@components/form/Input';
import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';

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

export const Input = styled(DSFRInput)`
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
      background-color: var(--background-light);
      border: 1px solid var(--border-default-grey);
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

export const SimulatorHeader = styled.p`
  font-size: 1.25em;
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
