import DSFRAlert, { type AlertProps as DSFRAlertProps } from '@codegouvfr/react-dsfr/Alert';
import React from 'react';

import cx from '@/utils/cx';

export type AlertProps = Omit<DSFRAlertProps, 'small' | 'description' | 'severity'> & {
  size?: 'sm' | 'md';
  children: React.ReactNode;
  variant: DSFRAlertProps['severity'];
};

const classNames = {
  sizes: {
    sm: 'text-sm !py-2 !pr-2',
    md: '',
  },
};

const Alert: React.FC<AlertProps> = ({ children, size = 'md', className, variant, isClosed, closable, ...props }) => {
  return (
    <DSFRAlert
      small={(size === 'sm') as any}
      severity={variant}
      description={(children as DSFRAlertProps['description']) || ''}
      className={cx(classNames.sizes[size], className)}
      closable={closable as any /** FIXME cause incompatibility with DSFR  */}
      isClosed={isClosed as any /** FIXME cause incompatibility with DSFR  */}
      {...props}
    />
  );
};

export default Alert;
