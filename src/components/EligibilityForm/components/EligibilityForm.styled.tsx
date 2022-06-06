import styled, { css } from 'styled-components';

export const CheckEligibilityFormLabel = styled.div<{ centred?: boolean }>`
  padding: 1em 0;
  ${({ centred }) =>
    centred &&
    css`
      text-align: center;
    `}
`;

export const ContactFormWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: stretch;
  padding: 1.5rem 0;
`;

export const ContactFormContentWrapper = styled.div`
  flex: 1;

  &:first-child {
    padding-right: 1rem;
    flex: 0.8;
  }
  &:last-child {
    padding-left: 1rem;
  }

  h4 {
    color: #4550e5;
    font-size: 1.5rem;
    line-height: 2rem;
    margin-bottom: 3rem;
  }

  ul {
    font-size: 1.2rem;
    line-height: 1.5;
    padding: 0;
  }

  li {
    font-weight: 600;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;

    ::before {
      display: block;
      padding-top: 0.15rem;
      margin-right: 0.5rem;
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
  align-items: flex-end;
  justify-content: flex-start;
`;

export const ContactFormResultMessage = styled.div<{
  eligible?: boolean;
  headerTypo?: string;
}>`
  box-shadow: inset 0.5rem 0 0 0
    ${({ eligible }) => (eligible ? '#00eb5e' : '#ea7c3f')};
  padding: 2rem 3rem;
  background-color: var(--g200);
  margin: 0.5rem 0;

  font-size: ${({ headerTypo }) => (headerTypo === 'small' ? '18px' : '25px')};

  p {
    font-size: 1em;
    line-height: 1.35;
    margin-bottom: 0.5em;
  }

  em.distance {
    display: block;
    margin: 0.5em 0 0;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
  }
`;

export const ContactFormEligibilityMessage = styled.div`
  font-size: 20px;
  line-height: 1.5;
  margin-top: 2em;
  color: #000074;
`;
