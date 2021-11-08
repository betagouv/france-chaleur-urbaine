import styled from 'styled-components';

export const TextCard = styled.div`
  height: ${({ height }: { height?: string }) => height || 'max-content'};
`;
