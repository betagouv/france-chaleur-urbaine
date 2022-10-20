import styled from 'styled-components';

export const Container = styled.div`
  background-color: white;
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  padding: 32px;
  align-items: center;
  justify-content: center;

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
