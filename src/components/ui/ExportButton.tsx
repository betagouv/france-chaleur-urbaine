import { useCallback, useState } from 'react';

import Button, { ButtonProps } from './Button';

const ExportButton = ({
  onExport,
  buttonText,
  buttonProps,
}: {
  onExport: () => Promise<any>;
  buttonText: string;
  buttonProps?: React.FC<ButtonProps>;
}) => {
  const [exporting, setExporting] = useState(false);

  const onClickExport = useCallback(async () => {
    setExporting(true);
    await onExport().finally(() => {
      setExporting(false);
    });
  }, [exporting]);

  return (
    <Button {...buttonProps} loading={exporting} onClick={onClickExport}>
      {buttonText}
    </Button>
  );
};

export default ExportButton;
