import { ComboboxInput } from '@components/ui/Combobox';

type AddressInputProps = {
  placeholder?: string;
  onChange: (event: React.FormEvent<HTMLInputElement>) => any;
  value: string;
};

const AddressInput: React.FC<AddressInputProps> = ({
  placeholder = '',
  onChange,
  value,
}) => (
  <ComboboxInput
    className="fr-input"
    type="text"
    id="address"
    name="address"
    placeholder={placeholder}
    onChange={onChange}
    value={value}
    autoComplete="off"
  />
);

export default AddressInput;
