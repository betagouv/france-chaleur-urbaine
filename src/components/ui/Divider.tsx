import { type HTMLAttributes } from 'react';

import Box from './Box';
import { type SpacingProperties } from './helpers/spacings';

interface DividerProps extends SpacingProperties, HTMLAttributes<HTMLDivElement> {
  vertical?: string;
}

function Divider({ vertical, ...props }: DividerProps) {
  return (
    <Box
      {...(vertical ? { minWidth: '1px', mx: '2w', height: vertical } : { minHeight: '1px', my: '2w' })}
      backgroundColor="#dddddd"
      {...props}
    />
  );
}

export default Divider;
