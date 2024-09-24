import { HTMLAttributes } from 'react';

import Box from './Box';
import { SpacingProperties } from './helpers/spacings';

interface DividerProps extends SpacingProperties, HTMLAttributes<HTMLDivElement> {}

export default function Divider(props: DividerProps) {
  return <Box minHeight="1px" backgroundColor="#DDDDDD" my="1w" {...props} />;
}
