import { createGlobalStyle } from 'styled-components';

export const SliceContactFormStyle = createGlobalStyle`
.slice-contact-form-wrapper {
  max-height: 0px;
  overflow: hidden;
  transition: max-height 1s ease;

  &.active {
    max-height: 5000px;
  }
}
`;
