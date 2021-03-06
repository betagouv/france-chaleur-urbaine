import { ComboboxInput } from '@reach/combobox';

type AddressInputProps = {
  placeholder?: string;
  onChange: (event: React.FormEvent<HTMLInputElement>) => any;
};

const AddressInput: React.FC<AddressInputProps> = ({
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

export default AddressInput;
