import { HTMLAttributes } from 'react';

import Box from './Box';
import { SpacingProperties } from './helpers/spacings';

interface DividerProps extends SpacingProperties, HTMLAttributes<HTMLDivElement> {
  vertical?: string;
}

export default function Divider({ vertical, ...props }: DividerProps) {
  return (
    <Box
      {...(vertical ? { minWidth: '1px', mx: '2w', height: vertical } : { minHeight: '1px', my: '2w' })}
      backgroundColor="#dddddd"
      {...props}
    />
  );
}
