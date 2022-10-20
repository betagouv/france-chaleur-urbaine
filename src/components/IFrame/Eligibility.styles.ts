import styled from 'styled-components';

export const Container = styled.div`
  max-width: 650px;
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  align-items: center;
  justify-content: flex-start;

  .fr-form-group,
  .fr-input-group {
    margin-bottom: 0 !important;
  }
  .fr-input-group {
    flex: 1 1 auto;
    width: 350px;
  }
`;

export const Result = styled.div`
  margin: auto;
`;
