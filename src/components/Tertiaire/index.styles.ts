import { createGlobalStyle } from 'styled-components';

export const TertiaireStyle: any = createGlobalStyle`
  .presentation-rcu-tertiaire {
    .presentation-rcu-tertiaire-body {
      flex: 1;
      color: var(--bf500);

      @media (min-width: 992px) {
        padding: 0 3rem;
      }

      p {
        font-size: 1.12rem;
        line-height: 1.5;
      }
    }

    .presentation-rcu-tertiaire-cartridge {
      position: relative;

      @media (max-width: 991px) {
        padding: 1em 1.5em;
      }

      @media (min-width: 992px) {
        padding-right: 17.5rem;
      }

      .presentation-rcu-tertiaire-percent {
        display: block;
        text-align: center;

        top: 3rem;
        right: 1em;
        font-size: 0.85em !important;

        margin: 0.1em;

        @media (min-width: 440px) {
          display: inline-block;
        }

        @media (min-width: 992px) {
          position: absolute;
        }

        strong {
          display: block;
          font-size: 1.6em;
          margin-bottom: -0.2em;
        }

        @media (min-width: 992px) {
          &:nth-child(2n) {
            margin-right: 5.5em;
          }

          &:nth-child(3n) {
            margin-right: 11em;
          }
        }
      }
    }

    .presentation-rcu-tertiaire-cartridge-conso {
      @media (min-width: 992px) {
        margin-right: 4.5em;
      }

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
