import styled, { css } from 'styled-components';

const eligibleStyle = {
  color: '#18753c',
  bgColor: '#b8fec9',
};
const ineligibleStyle = {
  color: '#ce0500',
  bgColor: '#ffe9e9',
};
const transparency = 'a6'; // Equal to 70%

type MapCardType = {
  isEligible?: boolean;
  typeCard?: string;
};

export const MapCard = styled.div<MapCardType>`
  width: 100%;
  display: block;
  background-color: white;
  margin: 1em 0;
  border: 2px solid var(--bf500);
  border: 1px solid rgb(0 0 0 / 20%);

  border-radius: 0.3em;
  overflow: hidden;

  box-shadow: 1px 0 4px 1px rgb(0 0 0 / 20%);

  ${({ typeCard, isEligible }) => {
    switch (typeCard) {
      case 'search': {
        return css`
          border: 2px solid
            ${isEligible ? eligibleStyle.bgColor : ineligibleStyle.bgColor};
        `;
        break;
      }
      case 'legend': {
        return css`
          border: 2px solid #4550e5;
        `;
        break;
      }
    }
  }}

  > header {
    display: block;
    cursor: pointer;
    padding: 0.5em;

    font-weight: bold;

    ${({ typeCard, isEligible }) => {
      switch (typeCard) {
        case 'search': {
          return css`
            background-color: ${isEligible
              ? eligibleStyle.bgColor
              : ineligibleStyle.bgColor};
            color: ${isEligible ? eligibleStyle.color : ineligibleStyle.color};
          `;
          break;
        }
        case 'legend': {
          return css`
            background-color: #4550e5;
            color: #ffffff;
          `;
          break;
        }
      }
    }}
  }

  section {
    padding: 0.5em;
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
