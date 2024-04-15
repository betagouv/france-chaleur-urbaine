import { legacyColors } from '@components/ui/helpers/colors';
import styled from 'styled-components';

export const IFrameBox = styled.button`
  border: solid 1px ${legacyColors.darkerblue};
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  color: ${legacyColors.darkerblue};
`;

export const CopyInfo = styled.div`
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  padding: 0 4px;
  border-radius: 4px;
  font-size: 10px;
  position: absolute;
  color: white;
  background-color: black;
`;
