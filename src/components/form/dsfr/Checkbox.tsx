import Checkboxes, { type CheckboxesProps } from './Checkboxes';

type CheckboxOption = CheckboxesProps['options'][number];
export type CheckboxProps = Omit<CheckboxesProps, 'options'> &
  Omit<CheckboxOption, 'nativeInputProps'> & { nativeInputProps?: CheckboxOption['nativeInputProps'] & { name: string } };

const Checkbox: React.FC<CheckboxProps> = ({ label, hintText, nativeInputProps, ...props }) => {
  return <Checkboxes options={[{ hintText, label, nativeInputProps: nativeInputProps || {} }]} {...props} />;
};

export default Checkbox;
