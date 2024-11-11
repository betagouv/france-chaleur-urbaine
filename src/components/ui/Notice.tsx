import DSFRNotice, { type NoticeProps as DSFRNoticeProps } from '@codegouvfr/react-dsfr/Notice';
import React from 'react';
import styled, { css } from 'styled-components';

export type NoticeProps = Omit<DSFRNoticeProps, 'isClosable' | 'title'> & {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
} & ({ title: string; children?: never } | { children: React.ReactNode; title?: never });

const StyledNotice = styled(DSFRNotice)<{ onClick?: NoticeProps['onClick'] }>`
  ${({ onClick }) =>
    onClick &&
    css`
      cursor: pointer;
    `}
`;

const Notice: React.FC<NoticeProps> = ({ children, className, onClose, onClick, title, ...props }) => {
  return (
    <StyledNotice
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      title={children || title}
      onClose={onClose}
      isClosable={
        /* Force isCloseable when onClose is defined https://github.com/codegouvfr/react-dsfr/issues/342 */
        !!onClose
      }
      {
        /* Add an onClick handler as there is none in DSFR */
        ...(onClick && ({ onClick } as any))
      }
      {...props}
    />
  );
};

export default Notice;
