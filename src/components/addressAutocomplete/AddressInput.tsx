import { ComboboxInput } from '@reach/combobox';
import React from 'react';

type AddressInputProps = {
  placeholder?: string;
  onChangeCallback: (event: React.FormEvent<HTMLInputElement>) => any;
};
export const AddressInput: React.FC<AddressInputProps> = ({
  placeholder = 'Exemple: 5 avenue Anatole 75007 Paris',
  onChangeCallback,
}) => (
  <ComboboxInput
    className="fr-input"
    type="text"
    id="address"
    name="address"
    placeholder={placeholder}
    onChange={onChangeCallback}
  />
);
