'use client';
import { useQueryState } from 'nuqs';
import React from 'react';
import originalToast, { Toaster } from 'react-hot-toast';

export const toast = originalToast;

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
