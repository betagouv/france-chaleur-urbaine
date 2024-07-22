import styled, { css } from 'styled-components';

const eligibleStyle = {
  color: '#000000',
  bgColor: '#78EB7B',
};
const ineligibleStyle = {
  color: '#000000',
  bgColor: '#ea7c3f',
};

type MapCardType = {
  isEligible: boolean;
  collapsed?: boolean;
};

export const MapCard = styled.div<MapCardType>`
  width: 100%;
  display: block;
  position: relative;
  margin-bottom: 8px;
  background-color: var(--background-default-grey);
  border-style: solid;
  border-width: 0 0 ${({ collapsed }) => (collapsed ? '0' : '10px')} 0;

  border-radius: 4px;
  overflow: hidden;

  @media (prefers-color-scheme: light) {
    box-shadow: 1px 0 4px 1px rgb(0 0 0 / 20%);
  }
  @media (prefers-color-scheme: dark) {
    box-shadow: 1px 0 4px 1px rgb(255 255 255 / 20%);
  }

  > header {
    padding: 8px 62px 8px 8px;
    cursor: pointer;
    > .icon-left {
      margin-right: 0;
    }
  }

  ${({ isEligible }) =>
    isEligible
      ? css`
          border-color: ${eligibleStyle.bgColor};
          > header {
            background-color: ${eligibleStyle.bgColor};
            color: ${eligibleStyle.color};
          }
        `
      : css`
          border-color: ${ineligibleStyle.bgColor};
          > header {
            background-color: ${ineligibleStyle.bgColor};
            color: ${ineligibleStyle.color};
          }
        `}

  section {
    padding: 8px;
    scrollbar-gutter: stable both-edges;
    transition:
      max-height 0.75s ease,
      padding 0.5s ease 0.25s;
  }
`;

export const HeaderButtons = styled.div`
  position: absolute;
  top: 8px;
  right: 0;
  display: flex;

  > button {
    padding: 0;
    margin-right: 8px;
    cursor: pointer;
    background-color: var(--background-default-grey);
    box-shadow: 0 1px 2px 1px #33333333;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    > span {
      margin-top: -3px; // fix icon vertical alignment
    }

    &:hover {
      background-color: var(--background-default-grey-hover);
    }
  }
`;

export const EligibilityResult = styled.div<MapCardType>`
  background-color: var(--background-default-grey-hover);
  padding: 8px 8px 8px 16px;
  margin-bottom: 8px;
  font-size: 14px;

  ${({ isEligible }) => css`
    box-shadow: inset 8px 0 0 0
      ${(isEligible ? eligibleStyle : ineligibleStyle).bgColor};
  `}
`;

export const ContactFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 8px;

  header {
    margin-bottom: 32px;
  }
`;

export const ContactFormButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MessageConfirmBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0 0;
  padding: 0 8px 0 0;
`;
