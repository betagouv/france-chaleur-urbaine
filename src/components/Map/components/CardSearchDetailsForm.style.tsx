import styled, { createGlobalStyle } from 'styled-components';

export const CardSearchDetailsFormStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
  .slice-contact-form-wrapper {
    max-height: 0px;
    overflow: hidden;
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
  overflow: hidden;
  max-height: ${({ active }) => (active ? '500vh' : '0px')};
  transition: max-height 1s ease;
`;

export const CloseButtonWrapper = styled.div<{ active: boolean }>`
  display: ${({ active }) => (active ? 'flex' : 'none')};
  justify-content: center;
  margin-top: 16px;
`;
