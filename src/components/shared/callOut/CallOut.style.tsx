import styled from 'styled-components';

const COLORS_MAP = { success: '#00eb5e', error: '#e10600', default: '#000091' };
type CallOutContainerProps = {
  variant: 'success' | 'error' | 'default';
};
export const CallOutContainer = styled.div<CallOutContainerProps>`
  ${({ variant }) =>
    variant in COLORS_MAP &&
    `box-shadow: inset 0.25rem 0 0 0 ${COLORS_MAP[variant]}`}
`;
