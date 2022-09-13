import { fullscreenHeaderHeight } from '@components/shared/layout/MainLayout';
import styled, { css } from 'styled-components';

const eligibleStyle = {
  color: '#18753c',
  bgColor: '#b8fec9',
};
const ineligibleStyle = {
  color: '#ce0500',
  bgColor: '#ffe9e9',
};
const gasUsageStyle = {
  color: '#000',
  bgColor: '#ccc',
};
const transparency = 'a6'; // Equal to 70%

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
  border: 2px solid var(--bf500);
  border: 1px solid rgb(0 0 0 / 20%);

  border-radius: 0.3em;
  overflow: hidden;

  box-shadow: 1px 0 4px 1px rgb(0 0 0 / 20%);

  > header {
    padding: 8px 24px 8px 8px;
    cursor: ${({ isClickable }) => (isClickable ? 'pointer' : 'default')};

    font-weight: bold;
  }

  .closeButton {
    position: absolute;
    top: 2px;
    right: 2px;

    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    box-shadow: 0 1px 2px 1px #33333333;
    width: 1.25rem;
    height: 1.25rem;
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
    border: 2px solid ${eligibleStyle.bgColor};

    > header {
      background-color: ${eligibleStyle.bgColor};
      color: ${eligibleStyle.color};
    }
  }

  &.ineligible {
    border: 2px solid ${ineligibleStyle.bgColor};

    > header {
      background-color: ${ineligibleStyle.bgColor};
      color: ${ineligibleStyle.color};
    }
  }

  &.energyCard {
    border: 2px solid ${ineligibleStyle.bgColor};

    > header {
      background-color: ${ineligibleStyle.bgColor};
      color: ${ineligibleStyle.color};
    }
  }

  &.gasUsageCard {
    border: 2px solid ${gasUsageStyle.bgColor};

    > header {
      background-color: ${gasUsageStyle.bgColor};
      color: ${gasUsageStyle.color};
    }
  }

  &.legendCard {
    border: 2px solid #4550e5;

    > header {
      background-color: #4550e5;
      color: #ffffff;
    }
  }

  section {
    padding: 0.5em;
    overflow: auto;
    scrollbar-gutter: stable both-edges;

    max-height: calc(100vh - ${fullscreenHeaderHeight} - 180px);
    transition: max-height 0.75s ease, padding 0.5s ease 0.25s;
  }

  &.close {
    section {
      max-height: 0;
      padding: 0 0.5em;
    }
  }
`;

export const EligibilityResult = styled.div<MapCardType>`
  background-color: #eeeeee;
  padding: 0.5em;
  margin-bottom: 0.5em;
  border-left: 2px solid;

  ${({ isEligible }) =>
    css`
      border-color: ${isEligible ? eligibleStyle.color : ineligibleStyle.color}${transparency};
    `}
`;

export const EnergyResult = styled.div`
  padding: 0.5em;
  margin-bottom: 0.5em;
  border-left: 2px solid;

  border-color: #c72e6e;
`;
export const GasUsageResult = styled.div`
  padding: 0.5em;
  margin-bottom: 0.5em;
  border-left: 2px solid;

  border-color: #136ce0;
`;
