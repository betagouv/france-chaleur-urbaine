import { useCallback, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import Box from './Box';
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
    <Box>
      {exporting ? (
        <Oval height={40} width={40} />
      ) : (
        <Button {...buttonProps} onClick={onClickExport}>
          {buttonText}
        </Button>
      )}
    </Box>
  );
};

export default ExportButton;
