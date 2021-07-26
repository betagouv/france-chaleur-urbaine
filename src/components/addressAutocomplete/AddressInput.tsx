import { ComboboxInput } from '@reach/combobox';
import React from 'react';

type AddressInputProps = {
  placeholder?: string;
  onChange: (event: React.FormEvent<HTMLInputElement>) => void;
};
export const AddressInput: React.FC<AddressInputProps> = ({
  placeholder = 'Exemple: 5 avenue Anatole 75007 Paris',
  onChange,
}) => (
  <ComboboxInput
    className="fr-input"
    type="text"
    id="address"
    name="address"
    placeholder={placeholder}
    onChange={onChange}
  />
);
