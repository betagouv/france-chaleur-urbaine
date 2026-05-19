import styled from 'styled-components';

export const Arrow = styled.div`
  cursor: pointer;
`;

export const PartnerImages = styled.div`
  display: flex;
  gap: 48px;
  overflow: hidden;
  shrink: 1;
  a[target='_blank'] {
    &::after {
      display: none;
    }
  }
`;

export const PartnerImage = styled.img`
  cursor: pointer;
  background-color: white;
  height: 100px;
`;
