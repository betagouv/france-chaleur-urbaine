import styled from 'styled-components';

export const Container = styled.div`
  background-color: white;
  padding: 0 32px 32px 32px;

  .fr-form-group,
  .fr-input-group {
    margin-bottom: 0 !important;
  }
  .fr-input-group {
    flex: 1 1 auto;
    width: 350px;
  }
`;

export const Header = styled.div`
  display: flex;
  flex-wrap: wrap-reverse;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  @media (max-width: 873px) {
    margin-bottom: 16px;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px 32px;
`;
