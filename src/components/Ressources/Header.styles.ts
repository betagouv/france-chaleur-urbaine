import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  gap: 32px;
  max-width: 75%;
  align-items: center;
`;

export const Image = styled.img`
  width: 200px;
  display: none;
  @media (min-width: 992px) {
    display: block;
  }
`;
