import styled from 'styled-components';

export const Container = styled.div`
  h1 {
    margin-bottom: 4px;
  }

  .noicon {
    background-image: none;
    line-height: 0;

    &::after {
      content: none !important;
    }
  }
`;

export const Image = styled.img`
  margin: auto;
  width: 100%;
  max-width: 600px;
`;
