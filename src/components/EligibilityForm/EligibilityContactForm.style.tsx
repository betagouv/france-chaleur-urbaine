import styled, { createGlobalStyle } from 'styled-components';

export const EligibilityContactFormStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
  .slice-contact-form-wrapper {
    max-height: 0px;
    transition: max-height 1s ease;

    &.active {
      max-height: 500vh;
    }
  }
`;

export const Container = styled.div`
  width: 100%;
  max-width: 550px;
  text-align: left;
  margin: auto;
`;

export const ContactFormWrapper = styled.div<{ active: boolean }>`
  ${({ active }) => !active && 'overflow: hidden;'}
  max-height: ${({ active }) => (active ? '500vh' : '0px')};
  transition: max-height 1s ease;
  .fr-btn,
  .fr-input,
  .fr-fieldset__legend,
  .fr-label {
    font-size: 14px !important;
    line-height: 21px !important;
  }

  .fr-form-group {
    margin-bottom: 8px;
  }
`;

export const CloseButtonWrapper = styled.div<{ active: boolean }>`
  display: ${({ active }) => (active ? 'flex' : 'none')};
  justify-content: center;
  margin-top: 16px;
`;
