import { Link, Modal } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export const StyledModal = styled(Modal)`
  display: flex;
  justify-content: center;
`;

export const ModalContentWrapper = styled.div`
  margin-top: -2em;
`;

export const LayoutTwoColons = styled.div`
  display: flex;
`;

export const BlackNumbersLine = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

export const HorizontalSeparator = styled.div`
  width: 100%;
  border: 1px solid #e1e1e1;
`;

export const DistanceLineText = styled.div`
  font-size: 13px;
  margin-top: 16px;
  margin-bottom: 8px;
`;

export const BlackText = styled.div`
  font-size: 14px;
`;

export const BigBlueText = styled.div`
  color: #4550e5;
  font-size: 26px;
  font-weight: bold;
  margin-top: 24px;
`;

export const BlueText = styled.div`
  color: #4550e5;
  font-size: 14px;
`;

export const GreyText = styled.div`
  color: #858585;
  font-size: 14px;
`;

export const BlackNumber = styled.div`
  color: #1a1f1c;
  font-size: 18px;
  font-weight: bold;
`;

export const BigBlueNumber = styled.div`
  color: #4550e5;
  font-size: 30px;
  font-weight: bold;
`;

export const BlueNumber = styled.div`
  font-size: 18px;
  color: #4550e5;
  font-weight: bold;
`;

export const GreyNumber = styled.div`
  font-size: 18px;
  color: #858585;
  font-weight: bold;
`;

export const Bin = styled.div<{ color: string }>`
  white-space: nowrap;

  &:before {
    content: '';
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 12px;
    background-color: ${({ color }) => color};
  }
`;

export const LegendTitle = styled.div`
  color: #4550e5;
  line-height: 1em;
  margin-bottom: 8px;
`;

export const LegendSourceLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
`;

export const SourceLink = styled(Link)`
  color: #999;
`;
