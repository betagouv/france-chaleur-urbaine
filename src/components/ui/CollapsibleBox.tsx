import { PropsWithChildren } from 'react';
import Box from './Box';

interface CollapsibleBoxProps {
  id: string;
  expand: boolean | undefined;
  className?: string;
}

export default function CollapsibleBox({
  id,
  expand,
  className,
  children,
  ...props
}: PropsWithChildren<CollapsibleBoxProps>) {
  return (
    <Box position="relative">
      <div id={id} className={`${className ?? ''} fr-collapse`} {...props}>
        {children}
      </div>
    </Box>
  );
}
