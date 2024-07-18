import styled from 'styled-components';

const ScaleLabel = styled.div`
  position: absolute;
  top: 16px;
  padding: 8px;
  width: fit-content;
  border-radius: 6px;
  background-color: var(--info-975-75);
  font-size: 12px;
  text-align: center;
`;

export const ScaleMinLabel = styled(ScaleLabel)`
  left: -16px;
`;

export const ScaleMaxLabel = styled(ScaleLabel)`
  right: -16px;
`;
