import { useCallback, useState } from 'react';

import Button, { type ButtonProps } from './Button';

type AsyncButtonProps = Omit<ButtonProps, 'onClick' | 'loading'> & {
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
  }, [loading]);

  return (
    <Button
      loading={loading}
      disabled={disabled || loading}
      onClick={() => onAsyncClick()}
      {
        ...(props as any) /* FIXME don't manage to make it work with typescript */
      }
    >
      {children}
    </Button>
  );
};

export default AsyncButton;
