import DSFRNotice, { type NoticeProps as DSFRNoticeProps } from '@codegouvfr/react-dsfr/Notice';
import React from 'react';

export type NoticeProps = Omit<DSFRNoticeProps, 'isClosable' | 'title'> &
  ({ title: NonNullable<React.ReactNode>; children?: never } | { children: NonNullable<React.ReactNode>; title?: never });

const Notice: React.FC<NoticeProps> = ({ children, className, onClose, title, ...props }) => {
  return (
    <DSFRNotice
      className={className}
      title={children || title}
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
