import { ComboboxInput } from '@reach/combobox';
import React from 'react';

type AddressInputProps = {
  placeholder?: string;
  onChange: (event: React.FormEvent<HTMLInputElement>) => any;
};
export const AddressInput: React.FC<AddressInputProps> = ({
  placeholder = '',
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
