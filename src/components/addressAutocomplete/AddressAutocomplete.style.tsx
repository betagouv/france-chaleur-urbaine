import styled, { createGlobalStyle } from 'styled-components';

export const AddressAutocompleteGlobalStyle = createGlobalStyle`
  .fr-input {
    transition: box-shadow .5s ease;
    color: #000074;

    :focus {
      box-shadow: inset 0 -2px 0 0 #000074;
    }
  }

  .fr-input-wrap {
    box-shadow: 0 0 5px rgb(0 0 0 / 74%);
    border-radius: .25rem .25rem 0 0;
  }
`;

export default AddressAutocompleteGlobalStyle;

export const EmptySuggestion = styled.p`
  margin: 0;
  color: '#454545';
  padding: '0.25rem 1rem 0.75rem 1rem';
  font-style: 'italic';
`;
