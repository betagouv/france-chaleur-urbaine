import { useCallback, useState } from 'react';

import Button, { type ButtonProps } from './Button';

type ExportButtonProps = Omit<ButtonProps, 'onClick' | 'loading'> & {
  onExport: () => Promise<any>;
};

const ExportButton = ({ children, onExport, ...props }: ExportButtonProps) => {
  const [exporting, setExporting] = useState(false);

  const onClickExport = useCallback(async () => {
    setExporting(true);
    await onExport().finally(() => {
      setExporting(false);
    });
  }, [exporting]);

  return (
    <Button
      loading={exporting}
      onClick={() => onClickExport()}
      {
        ...(props as any) /* FIXME don't manage to make it work with typescript */
      }
    >
      {children}
    </Button>
  );
};

export default ExportButton;
