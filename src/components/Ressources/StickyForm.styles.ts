import styled from 'styled-components';

export const Container = styled.div`
  padding: 13px;
  max-width: 1275px;
  max-height: 50vh;
  overflow: auto;
  margin: auto;
  position: sticky;
  margin-top: -32px;
  top: 0px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 32px;
  background-color: white;
  border: 1px solid #b4b4b4;
  box-shadow: 0px 4px 4px 0px #00000040;
  z-index: 1;

  .fr-form-group {
    margin-bottom: 0;
  }

  .fr-input-group {
    margin-bottom: 0 !important;
    min-width: 350px;
    flex-grow: 1;
  }
`;

export const Title = styled.div`
  max-width: 350px;
  font-size: 19px;
  font-weight: 600;
`;
