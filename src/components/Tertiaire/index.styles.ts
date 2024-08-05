import { createGlobalStyle } from 'styled-components';

export const TertiaireStyle: any = createGlobalStyle`
  .aides-rcu {
    .aides-rcu-body {
      display: flex;
      flex-wrap: wrap;
      flex: 1;
      color: var(--bf500);

      ${({ theme }) => theme.media.lg`
        padding: 0 3rem;
      `}

      p {
        font-size: 1.15rem;
        line-height: 1.5;
      }
    }
  }
`;
