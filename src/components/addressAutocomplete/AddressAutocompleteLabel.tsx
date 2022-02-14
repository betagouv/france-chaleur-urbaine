import React from 'react';
type AddressAutocompleteLabelProps = {
  label: string;
  name?: string;
  centred?: boolean;
};
export const AddressAutocompleteLabel: React.FC<
  AddressAutocompleteLabelProps
> = ({ label, name = 'address', centred }) => {
  const className = `fr-text--lg fr-my-2w fr-grid-row ${
    centred ? 'fr-grid-row--center' : 'fr-grid-row--left'
  }`;
  return (
    <label className={className} htmlFor={name}>
      <span>{label}</span>
    </label>
  );
};
