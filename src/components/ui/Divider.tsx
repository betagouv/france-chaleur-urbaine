import type { HTMLAttributes } from 'react';

import cx from '@/utils/cx';

import Box from './Box';
import type { SpacingProperties } from './helpers/spacings';

interface DividerProps extends SpacingProperties, HTMLAttributes<HTMLDivElement> {
  vertical?: string;
}

function Divider({ vertical, ...props }: DividerProps) {
  return (
    <Box
      {...(vertical ? { height: vertical, minWidth: '1px', mx: '2w' } : { minHeight: '1px', my: '2w' })}
      backgroundColor="#dddddd"
      {...props}
    />
  );
}

export default Divider;

export const VerticalDivider = ({ className }: { className?: string }) => <div className={cx('h-12 w-px bg-gray-300', className)} />;
