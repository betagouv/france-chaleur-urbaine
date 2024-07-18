import styled from 'styled-components';

import { mapControlZindex } from '@components/Map/Map.style';

export const Filters = styled.div`
  display: flex;
  gap: 16px 24px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

export const Filter = styled.div`
  width: 250px;
  margin-bottom: 0 !important;
  z-index: ${mapControlZindex + 2};
  .fr-label {
    font-size: 0.9rem;
  }
`;

export const ExportButton = styled.div`
  flex-grow: 1;
  width: fit-content;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
`;
