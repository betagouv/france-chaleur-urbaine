import WrappedText from '@components/WrappedText';
import styled from 'styled-components';

export const Wrapper = styled(WrappedText)`
  .understanding-image {
    max-height: 500px;
  }
`;

export const Blocks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  margin: 32px 0;
  justify-content: space-between;
`;

export const Block = styled.div`
  width: calc(50% - 32px);
  @media (max-width: 576px) {
    width: 100%;
  }
`;

export const BlockTitle = styled.h2`
  line-height: 28px;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
`;
