import styled from 'styled-components';

export const Logo = styled.div`
  text-align: center;
`;

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  color: #4550e5;

  h3 {
    font-weight: 400;
    color: #4550e5;
  }

  iframe {
    aspect-ratio: 16 / 9;
  }
`;

export const Icon = styled.div`
  margin-bottom: 8px;

  &::before {
    --icon-size: 32px !important;
  }
`;

export const Quote = styled.blockquote`
  margin: 0 0 16px 0;
  font-size: 18px;
  line-height: 24px;
`;

export const Author = styled.p`
  font-size: 14px;
`;

export const VideoIndexes = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
`;

export const VideoIndex = styled.button<{ active: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: ${({ active }) => (active ? '#4550E5' : '#D9D9D9')};
  &:hover {
    background-color: ${({ active }) =>
      active ? '#4550E5' : '#D9D9D9'} !important;
  }
`;
