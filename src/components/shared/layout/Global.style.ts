import { createGlobalStyle } from 'styled-components';

import { SliceBody } from '@components/Slice/Slice.style';

export const GlobalStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
  .user-experience-description {
    position: relative;
    margin-top: 32px;
    
    ${({ theme }) => theme.media.lg`
      padding-left: 5.75em;
    `}

    .cartridge-4 {
      @media (max-width: 991px) {
        margin: -0.7em 0 0.5em 1.6em;
      }
    }
  }

  .enjeu-societe-description {
    .list-item {
      max-width: 350px;
    }
  }

  .enjeu-societe-img {
    max-width: 122px;
  }

  .fcuSolutionForFuturBody,
  .fcuSolutionForFuturFooter {
    text-align: center;
    
    ${({ theme }) => theme.media.lg`
      padding: 0 7rem;
    `}

    p {
      margin: 0;
      font-size: 1.5rem;
      line-height: 1.5;
    }
  }
  .fcuSolutionForFuturFooter {
    margin-top: 1rem;
    ${({ theme }) => theme.media.lg`
      margin-top: 3rem;
    `}
  }
  .fcuSolutionForFuturListing {
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
    gap: 32px;
    
    ${({ theme }) => theme.media.lg`
      margin-top: 3rem;
      justify-content: space-between;
      flex-direction: row;
    `}

    p {
      font-size: 1.05rem;
      line-height: 1.35;
      padding-top: 0.5em;
    }

    & > div {
      ${({ theme }) => theme.media.lg`
        flex: 1;
        max-width: 29%;
      `}
    }
  }

  .slice-comparatif-rcu {
    > div {
      flex: 3;
      width: auto;
      max-width: none;
    }

    .rcu-comparatif-image-tertiaire,
    .rcu-comparatif-image {
      position: relative;
      border-radius: 2.5rem;
      padding: 2rem 0 !important;

      justify-content: space-between;
      width: auto;
      max-width: none;
      
      .rcu-comparatif-image-legend {
        margin: 1rem 1rem 0 1rem;
        text-align: center;
        color: #4550E5;
        p {
          margin-bottom: 0;
        }
      }
    }
    
    .rcu-comparatif-image {
      flex-grow: 1;
      background-color: white;

    }
    .rcu-comparatif-image-tertiaire {
      flex: 3;
      background-color: #F9F8F6;
    }

    .rcu-comparatif-warning {
      flex: 1;
      width: auto;
      max-width: none;
      color: var(--bf500);
    }
  }

  .small-video {
    width: 75%;
    margin: auto;
  }

  .accueil-title {
    gap: 32px;
    max-width: 900px;
    margin: auto;
    align-items: center;
    h3 {
      color: #000074 !important;
      margin: 0
    }
  }

  .accueil-list {
    display: flex;
    justify-content: space-around;
    flex-direction: row;
    flex-wrap: wrap;
    div {
      max-width: 300px;
    }
  }

  .slice-carto-text {
    color: #000074;
    h3 {
      color: #000074 !important;
    }
    b {
      color: #4550E5
    }
    ${({ theme }) => theme.media.lg`
      padding-left: 64px;
    `}

    .button-with-margin {
      margin-right: 16px;
    }

    @media (max-width: 991px) {
      a {
        margin: 0 auto;
        display: block;
        max-width: 14em;
        text-align: center;
      }

      .button-with-margin {
        margin: 0 auto 24px auto;
      }
    }
  }

  .presentation-rcu-tertiaire {
    ${SliceBody} {
      align-items: center;
    }

    .presentation-rcu-tertiaire-cartridge {
      margin-bottom: 32px;
      ${({ theme }) => theme.media.lg`
        margin-bottom: 0;
        margin-right: 16px;
      `}
    }

    .presentation-rcu-tertiaire-body {
      ${({ theme }) => theme.media.lg`
        margin-left: 16px;
      `}
    }

    .presentation-rcu-tertiaire-cartridge,
    .presentation-rcu-tertiaire-body {
      flex: 1;
      color: var(--bf500);

      p {
        font-size: 1.12rem;
        line-height: 1.5;
      }
    }
    
    .presentation-rcu-tertiaire-cartridges {
      display: flex;
      gap: 16px;
      ${({ theme }) => theme.media.lg`
        gap: 32px;
      `}
      justify-content: center;
      margin-bottom: 16px;
      b {
        display: block;
        font-size: 1.6em;
      }
    }

    .presentation-rcu-tertiaire-cartridge-conso {
      display: flex;
      gap: 32px;
      align-items: center;
      
      strong {
        display: block;
        font-size: 4.2em;
        float: left;
        line-height: 1;
        margin-right: 0.3em;
      }
    }
  }
`;
