import styled from 'styled-components';

export const Container = styled.div`
  max-width: 1275px;
  max-height: 100vh;
  overflow: auto;
  position: sticky;
  margin: -32px auto 0 auto;
  top: 0px;
  padding: 8px;
  background-color: var(--background-default-grey);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 32px;
  border: 1px solid var(--border-default-grey);
  box-shadow: 0px 4px 4px 0px #00000040;
  @media (prefers-color-scheme: dark) {
    box-shadow: 0px 4px 4px 0px #ffffff40;
  }

  z-index: 5;

  .fr-form-group {
    margin-bottom: 0;
  }

  .fr-input-group {
    margin-bottom: 0 !important;
    width: 350px;
    flex-grow: 1;
  }
`;

export const Title = styled.div`
  max-width: 350px;
  font-size: 19px;
  font-weight: 600;
`;

export const Form = styled.div`
  position: relative;
  width: 100%;
`;

export const Close = styled.div`
  position: absolute;
  cursor: pointer;
  top: 16px;
  right: 16px;
`;
