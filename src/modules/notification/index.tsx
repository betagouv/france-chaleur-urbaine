'use client';
import * as Sentry from '@sentry/nextjs';
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
      void setNotifyParam(null);
    }
  }, [notifyParam, setNotifyParam]);

  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            border: '1px solid #EEE',
            boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.2)',
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
      handleClientError(err, customError);
    }
  };
};

const getFirstZodError = (properties?: any): string | undefined => {
  if (!properties || typeof properties !== 'object') return undefined;
  return Object.values<any>(properties)[0]?.errors[0];
};

/**
 * Handles client errors and shows a toast notification.
 */
export function handleClientError(err: any, customError?: (err: Error) => ReactNode) {
  const displayedMessage = getFirstZodError(err?.data?.zodError?.properties) || err?.message || String(err);
  console.error('client error', displayedMessage, err);
  notify('error', customError ?? displayedMessage);
  Sentry.captureException(err);
}
