import * as Sentry from '@sentry/nextjs';
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
    } catch (error) {
      // Les erreurs métier (tRPC) sont déjà notifiées globalement (errorHandlerLink) ; on évite l'unhandled
      // rejection tout en remontant à Sentry les erreurs inattendues (pour ne pas les masquer).
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  }, [onClick]);

  return (
    <Button loading={loading} disabled={disabled || loading} onClick={onAsyncClick} stopPropagation {...props}>
      {children}
    </Button>
  );
};

export default AsyncButton;
