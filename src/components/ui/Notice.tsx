import DSFRNotice, { type NoticeProps as DSFRNoticeProps } from '@codegouvfr/react-dsfr/Notice';
import React from 'react';

export type NoticeProps = Omit<DSFRNoticeProps, 'isClosable' | 'title' | 'severity'> &
  ({ title: NonNullable<React.ReactNode>; children?: never } | { children: NonNullable<React.ReactNode>; title?: never }) & {
    size?: 'sm';
    variant?: 'info' | 'warning' | 'alert';
  };

const classNames: { titles: { [key: string]: string }; root: { [key: string]: string } } = {
  titles: {
    sm: '!text-xs',
    md: '',
  },
  root: {
    sm: '!py-0.5 [&>div]:px-1.5',
    md: '',
  },
};

const Notice: React.FC<NoticeProps> = ({ children, className, onClose, variant, title, size = 'md', ...props }) => {
  return (
    <DSFRNotice
      className={className}
      title={children || title}
      classes={{
        title: classNames.titles[size],
        root: classNames.root[size],
      }}
      severity={variant}
      onClose={onClose}
      {...({
        /* Force isCloseable when onClose is defined https://github.com/codegouvfr/react-dsfr/issues/342 */
        isClosable: !!onClose,
      } as any)}
      {...props}
    />
  );
};

export default Notice;
