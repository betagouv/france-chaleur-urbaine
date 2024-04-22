import styled, { css } from 'styled-components';

export const CheckEligibilityFormLabel = styled.div<{ colored?: boolean }>`
  ${({ colored }) =>
    colored &&
    css`
      label,
      legend {
        color: white !important;
      }
    `}
  display: block;
  overflow: hidden;
  max-height: 500px;
  transition: all 0.3s ease;
`;

export const ContactFormWrapper = styled.div<{ cardMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: stretch;

  ${({ cardMode }) => css`
    ${!cardMode ? 'padding: 24px 0' : ''};
    gap: ${cardMode ? '0' : '32px'};

    @media (min-width: 992px) {
      flex-direction: ${cardMode ? 'column' : 'row'};
    }
  `}
`;

export const ContactFormContentWrapper = styled.div`
  flex: 1;

  h4 {
    color: #4550e5;
    font-size: 24px;
    line-height: 32px;
    margin-bottom: 48px;
  }
  .h4-dark-blue h4 {
    color: var(--text-title-blue-france);
  }

  ul {
    font-size: 18px;
    line-height: 1.5;
    padding: 0;
  }

  li {
    font-weight: 600;
    margin-bottom: 24px;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;

    ::before {
      display: block;
      padding-top: 2px;
      margin-right: 8px;
      color: #2fab73;
    }

    &.ineligible {
      ::before {
        color: #4550e5;
      }
    }
  }
`;

export const ContactFormFooter = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
`;
export const ContactMapResult = styled.div`
  height: 370px;
  width: 100%;
`;

export const ContactFormResultMessage = styled.div<{
  eligible?: boolean;
  cardMode?: boolean;
}>`
  box-shadow: inset ${(cardMode) => (cardMode ? '8px' : '16px')} 0 0 0
    ${({ eligible }) => (eligible ? '#78EB7B' : '#ea7c3f')};
  background-color: var(--g200);
  margin-bottom: 8px;
  font-size: ${({ cardMode }) => (cardMode ? '14px' : '16px')};
  line-height: ${({ cardMode }) => (cardMode ? '18px' : '20px')};
  padding: ${({ cardMode }) => (cardMode ? '8px 16px' : '32px')};
  p {
    ${(cardMode) => cardMode && 'margin-bottom: 0;'}
  }
`;

export const ContactFormEligibilityMessage = styled.div<{
  cardMode?: boolean;
}>`
  font-size: 20px;
  line-height: 1.5;
  color: #000074;
  ${({ cardMode }) =>
    !cardMode &&
    css`
      margin-top: 40px;
    `};
`;

export const ContactFormEligibilityResult = styled.div<{
  cardMode?: boolean;
}>`
  background-color: #eeeeee;
  padding: 8px 8px 8px 16px;
  margin-bottom: 8px;
  font-size: 14px;
  box-shadow: inset 8px 0 0 0 var(--border-default-blue-france);

  font-size: ${({ cardMode }) => (cardMode ? '14px' : '18px')};
  line-height: ${({ cardMode }) => (cardMode ? 'inherit' : '1.5')};

  header {
    font-size: ${({ cardMode }) => (cardMode ? '14px' : '23.5px')};
    line-height: ${({ cardMode }) => (cardMode ? 'inherit' : '1.5')};
    font-weight: bold;
  }
`;
