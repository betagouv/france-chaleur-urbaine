import { useCallback, useState } from 'react';

import Button, { type ButtonProps } from './Button';

export type AsyncButtonProps = Omit<ButtonProps, 'onClick' | 'loading'> & {
  onClick: () => Promise<any>;
};

const AsyncButton = ({ children, onClick, disabled, ...props }: AsyncButtonProps) => {
  const [loading, setLoading] = useState(false);

  const onAsyncClick = useCallback(async () => {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  }, [loading, onClick]);

  return (
    <Button loading={loading} disabled={disabled || loading} onClick={onAsyncClick} stopPropagation {...props}>
      {children}
    </Button>
  );
};

export default AsyncButton;
