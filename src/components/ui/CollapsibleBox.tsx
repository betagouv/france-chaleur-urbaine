import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import Box from './Box';
import { Wrapper } from './CollapsibleBox.style';

interface CollapsibleBoxProps {
  expand: boolean | undefined;
  className?: string;
}

export default function CollapsibleBox({
  expand,
  className,
  children,
  ...props
}: PropsWithChildren<CollapsibleBoxProps>) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState('0px');

  useEffect(() => {
    if (boxRef.current) {
      setHeight(`-${boxRef.current?.getBoundingClientRect().height}px`);
    }
  }, [boxRef]);

  // hack to try to hide the initial expanded state
  const [classes, setClasses] = useState('initial-collapsed-state');
  useEffect(() => {
    setTimeout(() => {
      setClasses('');
    });
  }, []);

  return (
    <Box position="relative">
      <Wrapper
        ref={boxRef}
        className={` ${className ?? ''} fr-collapse ${
          expand ? 'fr-collapse--expanded' : ''
        } ${classes}`}
        style={
          {
            '--collapse': height,
            '--collapse-max-height': 'none',
          } as any
        }
        {...props}
      >
        {children}
      </Wrapper>
    </Box>
  );
}
