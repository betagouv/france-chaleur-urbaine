import styled from 'styled-components';

import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';

export const Box = styled(Cartridge)`
  @media (min-width: 1145px) {
    margin-bottom: -130px;
  }
  padding: 32px;
  max-width: 450px;
  h3 {
    margin-top: 16px;
    margin-bottom: 8px;
  }
  p {
    margin: 0;
  }
`;

export const CartridgeTitle = styled.div`
  font-size: 27px;
  font-weight: 800;
  line-height: 22px;
  margin-bottom: 4px;
`;

export const CartridgeContent = styled.div`
  font-size: 22px;
  font-weight: bold;
`;

export const CartridgeContentValue = styled.span`
  font-size: 26px;
  font-weight: bold;
`;
