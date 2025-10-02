import DSFRNotice, { type NoticeProps as DSFRNoticeProps } from '@codegouvfr/react-dsfr/Notice';
import type React from 'react';
import styled from 'styled-components';

import cx from '@/utils/cx';

export type NoticeProps = Omit<DSFRNoticeProps, 'isClosable' | 'title' | 'severity'> &
  ({ title: NonNullable<React.ReactNode>; children?: never } | { children: NonNullable<React.ReactNode>; title?: never }) & {
    size?: 'sm' | 'xs' | 'md';
    variant?: 'info' | 'warning' | 'alert';
  };

const classNames: { titles: { [key: string]: string }; root: { [key: string]: string } } = {
  root: {
    md: '',
    sm: 'py-2! [&>div]:px-2',
    xs: 'py-0.5! [&>div]:px-1.5',
  },
  titles: {
    md: '',
    sm: 'text-sm!',
    xs: 'text-xs!',
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
      title={<span>{children || title}</span>}
      classes={{
        root: cx(classNames.root[size], className),
        title: cx('inline-flex! items-center!', classNames.titles[size]),
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
