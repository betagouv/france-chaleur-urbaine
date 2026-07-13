import Colorful from '@uiw/react-color-colorful';

import type { UserTagColor } from '@/modules/users/constants';

type TagColorPickerProps = {
  value: UserTagColor;
  onChange: (color: UserTagColor) => void;
};

/** Color picker (react-color Colorful) for a tag's background color. */
const TagColorPicker = ({ value, onChange }: TagColorPickerProps) => (
  <Colorful color={value} disableAlpha onChange={(color: { hex: string }) => onChange(color.hex)} style={{ width: '100%' }} />
);

export default TagColorPicker;
