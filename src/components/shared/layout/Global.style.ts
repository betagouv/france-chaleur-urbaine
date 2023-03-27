import { createGlobalStyle } from 'styled-components';

export const GlobalStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
  .user-experience-description {
    position: relative;
    margin-top: 32px;
    
    @media (min-width: 992px) {
      padding-left: 5.75em;
    }

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
    
    @media (min-width: 992px) {
      padding: 0 7rem;
    }

    p {
      margin: 0;
      font-size: 1.5rem;
      line-height: 1.5;
    }
  }
  .fcuSolutionForFuturFooter {
    margin-top: 1rem;
    @media (min-width: 992px) {
      margin-top: 3rem;
    }
  }
  .fcuSolutionForFuturListing {
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
    gap: 32px;
    
    @media (min-width: 992px) {
      margin-top: 3rem;
      justify-content: space-between;
      flex-direction: row;
    }

    p {
      font-size: 1.05rem;
      line-height: 1.35;
      padding-top: 0.5em;
    }

    & > div {
      @media (min-width: 992px) {
        flex: 1;
        max-width: 29%;
      }
    }
  }

  .slice-comparatif-rcu {
    > div {
      flex: 3;
    width: auto;
    max-width: none;
    }

    .rcu-comparatif-image {
      position: relative;
      border-radius: 2.5rem;
      background-color: #F9F8F6;
      padding: 2rem 0 !important;

      flex: 3;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
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
    .rcu-comparatif-warning {
      flex: 1;
      width: auto;
      max-width: none;
      color: var(--bf500);

      @media (min-width: 992px) {
        padding-left: 4rem;
      }
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
`;
