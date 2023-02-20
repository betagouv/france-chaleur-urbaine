import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import styled from 'styled-components';

export const Box = styled(Cartridge)`
  @media (min-width: 1045px) {
    margin-top: -130px;
  }
  padding: 32px;
  width: 450px;
  h3 {
    margin-top: 16px;
    margin-bottom: 8px;
  }
  p {
    margin: 0;
  }
`;

export const CartridgeTitle = styled.div`
  font-size: 28px;
  font-weight: 800;
  line-height: 22px;
  margin-bottom: 4px;
`;

export const CartridgeContent = styled.div`
  font-size: 24px;
`;

export const CartridgeContentValue = styled.span`
  font-size: 28px;
`;
