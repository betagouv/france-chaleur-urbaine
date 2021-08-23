import React from 'react';
type AddressAutocompleteLabelProps = {
  label: string;
  name?: string;
};
export const AddressAutocompleteLabel: React.FC<AddressAutocompleteLabelProps> =
  ({ label, name = 'address' }) => (
    <label className="fr-label" htmlFor={name}>
      <span className="fr-hint-text fr-text--sm">{label}</span>
    </label>
  );
