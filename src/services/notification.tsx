'use client';
import { captureException } from '@sentry/browser';
import { useQueryState } from 'nuqs';
import React from 'react';
import originalToast, { Toaster } from 'react-hot-toast';

const toast = originalToast;

type Message = Parameters<typeof toast>['0'];
type Options = Parameters<typeof toast>['1'];
type Variant = 'success' | 'error';

export const notify = (variant: Variant, message: Message, options: Options = {}) => {
  return toast[variant](message, { ...options });
};

export const NotifierContainer = ({ children }: any) => {
  const [notifyParam, setNotifyParam] = useQueryState('notify');

  React.useEffect(() => {
    if (notifyParam) {
      const [variant, message] = notifyParam.split(':') as [Variant, string];
      toast[variant](message, { id: message });
      setNotifyParam(null);
    }
  }, [notifyParam, setNotifyParam]);

  return (
    <>
      <Toaster />
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
export const toastErrors = (func: () => Promise<any>) => {
  return async () => {
    try {
      return await func();
    } catch (err: any) {
      notify('error', err?.message || err);
      captureException(err);
    }
  };
};
