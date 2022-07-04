import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const Arrow = styled.div`
  cursor: pointer;
`;

export const PartnerImages = styled.div`
  display: flex;
  gap: 48px;
  overflow: hidden;
  flex-shrink: 1;
`;

export const PartnerImage = styled.img<{ display?: boolean }>`
  cursor: pointer;
  height: 100px;
  ${({ display }) =>
    !display &&
    css`
      display: none;
    `}
`;
