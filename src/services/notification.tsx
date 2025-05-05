'use client';
import { captureException } from '@sentry/browser';
import { useQueryState } from 'nuqs';
import React, { type ReactNode } from 'react';
import originalToast, { Toaster } from 'react-hot-toast';

const toast = originalToast;

type Message = Parameters<typeof toast>['0'];
type Options = Parameters<typeof toast>['1'];
type Variant = 'success' | 'error' | 'none';

export const notify = (variant: Variant, message: Message, options: Options = {}) => {
  const notifyFn = variant === 'none' ? toast : toast[variant];
  return notifyFn(message, { duration: 5000, ...options });
};

export const NotifierContainer = ({ children }: any) => {
  const [notifyParam, setNotifyParam] = useQueryState('notify');

  React.useEffect(() => {
    if (notifyParam) {
      const [variant, message] = notifyParam.split(':') as [Variant, string];
      notify(variant, message, { id: message });
      setNotifyParam(null);
    }
  }, [notifyParam, setNotifyParam]);

  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.2)',
            border: '1px solid #EEE',
          },
        }}
      />
      {children}
    </>
  );
};

/**
 * Wraps an asynchronous function to handle errors with toast notifications.
 *
 * @param func - The asynchronous function to execute.
 *
 * @returns A function that takes an asynchronous function (`func`), executes it,
 * and shows a toast notification with the error message if an error occurs.
 */
export const toastErrors = <Func extends (...args: any[]) => void | Promise<void>>(func: Func, customError?: (err: Error) => ReactNode) => {
  return async (...args: Parameters<Func>): Promise<void> => {
    try {
      await func(...args);
    } catch (err: any) {
      notify('error', customError ? customError(err) : err?.message || err);
      captureException(err);
    }
  };
};
