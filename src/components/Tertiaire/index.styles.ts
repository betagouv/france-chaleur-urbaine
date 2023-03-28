import { createGlobalStyle } from 'styled-components';

export const TertiaireStyle: any = createGlobalStyle`
  .presentation-rcu-tertiaire {
    .presentation-rcu-tertiaire-cartridge {
      margin-bottom: 32px;
      @media (min-width: 992px) {
        margin-bottom: 0;
        margin-right: 16px;
      }
    }
    .presentation-rcu-tertiaire-body {
      flex: 1;
      color: var(--bf500);

      @media (min-width: 992px) {
        margin-left: 16px;
      }

      p {
        font-size: 1.12rem;
        line-height: 1.5;
      }
    }
    
    .presentation-rcu-tertiaire-cartridges {
      display: flex;
      gap: 32px;
      justify-content: center;
      margin-bottom: 16px;
      b {
        display: block;
        font-size: 1.6em;
      }
    }

    .presentation-rcu-tertiaire-cartridge-conso {
      strong {
        display: block;
        font-size: 4.2em;
        float: left;
        line-height: 1;
        margin-right: 0.3em;
      }
    }
  }

  .aides-rcu {
    .aides-rcu-body {
      display: flex;
      flex-wrap: wrap;
      flex: 1;
      color: var(--bf500);

      @media (min-width: 992px) {
        padding: 0 3rem;
      }

      p {
        font-size: 1.15rem;
        line-height: 1.5;
      }
    }
  }
`;
