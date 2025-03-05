import DSFRNotice, { type NoticeProps as DSFRNoticeProps } from '@codegouvfr/react-dsfr/Notice';
import React from 'react';
import styled from 'styled-components';

import cx from '@/utils/cx';

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

const StyledDSFRNotice = styled(DSFRNotice)`
  /* Because it's impossible to override the default of the DSFR */
  & > div > div > p {
    display: flex;
  }
`;

const Notice: React.FC<NoticeProps> = ({ children, className, onClose, variant, title, size = 'md', ...props }) => {
  return (
    <StyledDSFRNotice
      className={cx('', className)}
      title={<span>{children || title}</span>}
      classes={{
        title: cx('!inline-flex !items-center', classNames.titles[size]),
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
