import styled from 'styled-components';

export const Success = styled.div`
  box-shadow: inset 0.25rem 0 0 0 #00eb5e;
`;
export const Error = styled.div`
  box-shadow: inset 0.25rem 0 0 0 #e10600;
`;

/*import styled from 'styled-components';
const COLORS_MAP = { success: '#00eb5e', error: '#e10600' };
export const CallOutContainer = styled.div<{
  variant: 'default' | 'success' | 'error';
}>`
  ${COLORS_MAP[props.variant] &&
`box-shadow: inset 0.25rem 0 0 0 ${COLORS_MAP[props.variant]}`}
`;*/
