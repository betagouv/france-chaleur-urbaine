import styled from 'styled-components';

export const Container = styled.div`
  ul {
    margin: 0;
  }
`;

export const WithVideo = styled.div`
  display: flex;
  flex-wrap: wrap-reverse;
  gap: 32px;
  > div {
    width: calc(50% - 16px);
    @media (max-width: 992px) {
      width: 100%;
    }
  }

  video {
    margin-bottom: 8px !important;
  }
`;

export const WithImage = styled.div`
  display: flex;
  flex-wrap: wrap-reverse;
  gap: 32px;
  justify-content: space-between;
  align-items: flex-end;

  img {
    width: 216px;
    margin-bottom: 8px !important;
  }

  > div:first-child {
    flex-grow: 1;
    width: calc(50% - 16px);
  }
`;
