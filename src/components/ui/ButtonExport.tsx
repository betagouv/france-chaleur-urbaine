import React from 'react';

import Button, { type ButtonProps } from '@/components/ui/Button';
import { exportAsXLSX, type SheetData } from '@/utils/export';

type ButtonExportProps = {
  filename: string;
  sheets: SheetData<any>[];
};

// This component should be imported dynamically to reduce initial bundle size
// Example usage:
// const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

const ButtonExport: React.FC<ButtonExportProps & ButtonProps> = ({ filename, sheets, children, ...props }) => {
  return (
    <Button onClick={() => exportAsXLSX(filename, sheets)} {...props}>
      {children}
    </Button>
  );
};

export default ButtonExport;
