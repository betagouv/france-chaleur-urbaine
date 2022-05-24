import styled, { createGlobalStyle, css } from 'styled-components';

export const SliceContactFormStyle = createGlobalStyle`
.slice-contact-form-wrapper {
  max-height: 0px;
  overflow: hidden;
  transition: max-height 1s ease;

  &.active {
    max-height: 1000px;
  }
}

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

export const CheckEligibilityFormLabel = styled.div<{ centred?: boolean }>`
  padding: 1em 0;
  ${({ centred }) =>
    centred &&
    css`
      text-align: center;
    `}
`;
