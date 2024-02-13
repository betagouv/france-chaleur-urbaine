import styled, { css } from 'styled-components';

export const Arrow = styled.div`
  cursor: pointer;
`;

export const PartnerImages = styled.div`
  display: flex;
  gap: 48px;
  overflow: hidden;
  flex-shrink: 1;
  a[target='_blank'] {
    &::after {
      display: none;
    }
  }
`;

export const PartnerLink = styled.a<{ show?: boolean }>`
  background-image: unset !important;
  ${({ show }) =>
    !show &&
    css`
      display: none;
    `}
`;

export const PartnerImage = styled.img`
  cursor: pointer;
  height: 100px;
`;
