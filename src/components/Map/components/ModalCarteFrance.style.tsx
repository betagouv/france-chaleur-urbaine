import { Modal } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export const StyledModal = styled(Modal)`
  display: flex;
  justify-content: center;
`;

export const Layout = styled.div`
  display: flex;
`;

export const HorizontalSeparator = styled.div`
  width: 100%;
  border: 1px solid #e1e1e1;
  margin: 16px 0;
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
