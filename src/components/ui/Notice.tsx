import DSFRNotice, { type NoticeProps as DSFRNoticeProps } from '@codegouvfr/react-dsfr/Notice';
import React from 'react';

export type NoticeProps = Omit<DSFRNoticeProps, 'isClosable' | 'title'> &
  ({ title: string; children?: never } | { children: React.ReactNode; title?: never });

const Notice: React.FC<NoticeProps> = ({ children, className, onClose, title, ...props }) => {
  return (
    <DSFRNotice
      className={className}
      title={children || title}
      onClose={onClose}
      isClosable={
        /* Force isCloseable when onClose is defined https://github.com/codegouvfr/react-dsfr/issues/342 */
        !!onClose
      }
      {...props}
    />
  );
};

export default Notice;
