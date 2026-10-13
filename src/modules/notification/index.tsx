'use client';

import * as Sentry from '@sentry/nextjs';
import { useQueryState } from 'nuqs';
import React from 'react';
import originalToast, { type Renderable, Toaster } from 'react-hot-toast';

import { genericErrorMessage, getUserFacingErrorMessage } from './client-error';

export { genericErrorMessage, getUserFacingErrorMessage } from './client-error';

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
 * @param customError - Replaces the generic message shown for errors that are not validation errors.
 *
 * @returns A function that takes an asynchronous function (`func`), executes it,
 * and shows a toast notification with the error message if an error occurs.
 */
export const toastErrors = <Func extends (...args: any[]) => void | Promise<void>>(
  func: Func,
  customError?: (err: Error) => Renderable
) => {
  return async (...args: Parameters<Func>): Promise<void> => {
    try {
      await func(...args);
    } catch (err: any) {
      handleClientError(err, customError);
    }
  };
};

// the tRPC link and `toastErrors` both receive the same error: one toast per error, updated by the second call
const errorToastIds = new WeakMap<object, string>();
let errorToastCounter = 0;

/**
 * Handles client errors and shows a toast notification: the message of a validation error (zod, 400) as is, else
 * the generic message (or `customError`) followed by the error message. See `getUserFacingErrorMessage`.
 */
export function handleClientError(err: any, customError?: (err: Error) => Renderable) {
  const userFacingMessage = getUserFacingErrorMessage(err);
  const detail: string = err?.message || String(err);
  console.error('client error', userFacingMessage ?? detail, err);
  const isErrorObject = typeof err === 'object' && err !== null;
  const alreadyNotified = isErrorObject && errorToastIds.has(err);
  let toastId = isErrorObject ? errorToastIds.get(err) : undefined;
  if (isErrorObject && !toastId) {
    toastId = `client-error-${++errorToastCounter}`;
    errorToastIds.set(err, toastId);
  }
  notify(
    'error',
    userFacingMessage ?? (
      <span>
        {customError?.(err) ?? genericErrorMessage}
        <br />
        <span className="text-xs text-gray-600">{detail}</span>
      </span>
    ),
    { id: toastId }
  );
  if (!alreadyNotified) {
    Sentry.captureException(err);
  }
}
