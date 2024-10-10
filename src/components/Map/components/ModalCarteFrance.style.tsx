import Button from '@codegouvfr/react-dsfr/Button';
import styled from 'styled-components';

import Icon from '@components/ui/Icon';
import Link from '@components/ui/Link';

export const PotentielsRaccordementButton = styled(Button)`
  display: flex;
  text-wrap: nowrap;
  gap: 8px;
`;

export const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export const ModalContentWrapper = styled.div`
  margin-top: -3em;
  margin-bottom: -48px; // diminue le padding de la modale
`;

export const LayoutTwoColumns = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

export const FirstColumn = styled.div`
  flex: 1;
  flex-grow: 3;
`;

export const SecondColumn = styled.div`
  flex: 1;
  flex-grow: 5;
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
  margin-bottom: 8px;
  margin-top: 8px;
`;

export const BlackText = styled.div`
  font-size: 14px;
`;

export const ExtraBigBlueText = styled.div`
  color: #4550e5;
  font-size: 26px;
  font-weight: bold;
  margin-top: 24px;
`;
export const BlueText = styled.div`
  color: #4550e5;
  font-size: 14px;
  line-height: 1.5em;
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

export const BigGreyNumber = styled.div`
  font-size: 30px;
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
  font-size: 13px;
  margin-top: -32px;
`;

export const DataLink = styled(Link)`
  color: #999;
`;

export const StyledIcon = styled(Icon)<{
  marginLeft?: string;
  marginTop?: string;
}>`
  position: absolute;
  margin-left: ${({ marginLeft }) => marginLeft ?? '0'};
  margin-top: ${({ marginTop }) => marginTop ?? '0'};
`;
