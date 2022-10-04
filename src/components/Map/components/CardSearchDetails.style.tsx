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
  isEligible?: boolean;
  typeCard?: string;
  isClickable?: boolean;
};

export const MapCard = styled.div<MapCardType>`
  width: 100%;
  display: block;
  position: relative;
  margin-bottom: 8px;
  background-color: white;
  border-style: solid;
  border-width: 0 0 10px;

  border-radius: 4px;
  overflow: hidden;

  box-shadow: 1px 0 4px 1px rgb(0 0 0 / 20%);

  > header {
    padding: 8px 32px 8px 8px;
    cursor: ${({ isClickable }) => (isClickable ? 'pointer' : 'default')};
  }

  .closeButton {
    position: absolute;
    top: 10px;
    right: 8px;

    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    box-shadow: 0 1px 2px 1px #33333333;
    width: 20px;
    height: 20px;
    border-radius: 50%;

    ::before,
    ::after {
      content: '';
      position: absolute;
      width: 2px;
      height: 80%;
      background-color: #333;
    }
    ::before {
      content: '';
      transform: rotate(-45deg);
    }
    ::after {
      content: '';
      transform: rotate(45deg);
    }
  }

  &.eligible {
    border-color: ${eligibleStyle.bgColor};

    > header {
      background-color: ${eligibleStyle.bgColor};
      color: ${eligibleStyle.color};
    }
  }

  &.ineligible {
    border-color: ${ineligibleStyle.bgColor};

    > header {
      background-color: ${ineligibleStyle.bgColor};
      color: ${ineligibleStyle.color};
    }
  }

  section {
    padding: 8px;
    scrollbar-gutter: stable both-edges;
    transition: max-height 0.75s ease, padding 0.5s ease 0.25s;
  }

  &.close {
    section {
      max-height: 0;
      padding: 0 8px;
    }
  }
`;

export const EligibilityResult = styled.div<MapCardType>`
  background-color: #eeeeee;
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
