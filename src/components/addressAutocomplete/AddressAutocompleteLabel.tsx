import React from 'react';
type AddressAutocompleteLabelProps = {
  label: string;
  name?: string;
  centred?: boolean;
};
export const AddressAutocompleteLabel: React.FC<AddressAutocompleteLabelProps> =
  ({ label, name = 'address', centred }) => (
    <label
      className={`fr-text--lg fr-my-2w fr-grid-row ${
        centred ? 'fr-grid-row--center' : 'fr-grid-row--left'
      }`}
      htmlFor={name}
    >
      <span>{label}</span>
    </label>
  );
