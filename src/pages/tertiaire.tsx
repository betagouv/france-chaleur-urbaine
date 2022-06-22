import Accordions from '@components/accordions';
import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import MainContainer from '@components/shared/layout';
import SimulateurCO2 from '@components/SimulatorCO2';
import Slice from '@components/Slice';
import SliceForm from '@components/SliceForm';
import WrappedBlock from '@components/WrappedBlock';
import {
  comparatifRcu,
  faqRcuTertiaire,
  fcuSolutionForFutur,
} from '@data/tertiaire';
import Head from 'next/head';
import React from 'react';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .user-experience-description {
    position: relative;
    padding-left: 5.75em;
  }

  .enjeu-societe-description {
    .list-item {
      max-width: 350px;
    }
  }
  .enjeu-societe-img {
    max-width: 122px;
  }

  /* ---  */

  .fcuSolutionForFuturBody,
  .fcuSolutionForFuturFooter {
    text-align: center;
    margin: 1rem 0;
    
    @media (min-width: 992px) {
      padding: 0 7rem;
      margin: 3rem 0;
    }

    p {
      font-size: 1.5rem;
      line-height: 1.5;
    }
  }
  .fcuSolutionForFuturListing {
    display: flex;
    flex-direction: column;
    
    @media (min-width: 992px) {
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
      padding: 2rem 0 1rem !important;

      flex: 3;
      justify-content: space-between;
      width: auto;
      max-width: none;

      .rcu-comparatif-image-legend {
        margin: 1rem;
        text-align: center;
        color: #4550E5;

        p {
          font-size: 1.25rem;
          line-height: 1.5;
        }
      }
    }
  }

  .presentation-rcu-tertiaire {
    .presentation-rcu-tertiaire-body {
      flex: 1;
      color: var(--bf500);
      
      @media (min-width: 992px) {
        padding: 3rem;
      }

      p {
        font-size: 1.12rem;
        line-height: 1.5;
      }

      h4 {
        margin-bottom: 0.25rem;
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
        padding: 3rem;
      }

      p {
        font-size: 1.15rem;
        line-height: 1.5;
      }
    }
  }
`;

export default function Home() {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
        />
        <title>
          France Chaleur Urbaine : Une solution numérique qui facilite le
          raccordement à un chauffage économique et écologique
        </title>
      </Head>

      <MainContainer currentMenu="/tertiaire">
        <div data-hidden={process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID}>
          <GlobalStyle />

          <HeadSliceForm
            bg="./img/head-slice-bg-tertiaire.png"
            pageBody={`
## Vos locaux sont chauffés au fioul ou au gaz&nbsp;?
# Optez pour un chauffage écologique et économique`}
            formLabel="Votre bâtiment peut-il être raccordé&nbsp;?"
            energyInputsLabels={{
              collectif: 'Central',
              individuel: 'Individuel',
            }}
            CheckEligibility
            needGradient
          />

          <Slice theme="color" padding={4}>
            <MarkdownWrapper
              value={fcuSolutionForFutur.body}
              className="fcuSolutionForFuturBody"
            />
            <MarkdownWrapper
              value={fcuSolutionForFutur.listing}
              className="fcuSolutionForFuturListing"
            />
          </Slice>

          <Slice
            padding={7}
            header={`##### VOUS ÊTES PROPRIÉTAIRE OU EXPLOITANT  
##### D'UN ÉTABLISSEMENT TERTIAIRE`}
            direction="row"
            className="presentation-rcu-tertiaire"
          >
            <MarkdownWrapper
              value={`
Vos bâtiments présentent une surface d’activités tertiaires (ou un 
cumul de surfaces) égale ou supérieure à 1 000 m²&nbsp;?  

**-> vous êtes assujettis au dispositif éco-énergie tertiaire&nbsp;!**  

Pour atteindre les objectifs du dispositif, vous pouvez optimiser 
l'exploitation de vos bâtiments, moderniser vos équipements, ou 
encore engager des travaux de rénovation énergétique.  

**C’est aussi le moment de changer votre mode de chauffage pour 
une solution moins émettrice de gaz à effet de serre&nbsp;!**

:::cartridge{theme="grey" className="presentation-rcu-tertiaire-cartridge"}
#### Obligation  

**de réduction des consommations d’énergie finale de l’ensemble 
du parc tertaire d’au moins :**  
:know-more-link{href="https://www.ecologie.gouv.fr/sites/default/files/20064_EcoEnergieTertiaire-4pages-2-1.pdf"}

::cartridge[**-40%** en 2030]{theme="yellow" className="presentation-rcu-tertiaire-percent"}  
::cartridge[**-50%** en 2040]{theme="yellow" className="presentation-rcu-tertiaire-percent"}  
::cartridge[**-60%** en 2050]{theme="yellow" className="presentation-rcu-tertiaire-percent"}  
:::
`}
              className="presentation-rcu-tertiaire-body"
            />

            <MarkdownWrapper
              value={`
![Attention](./icons/picto-warning.svg)  
Le 13 avril 2022, un arrêté modifiant celui du 10 avril 2020 
relatif aux obligations d’actions de réduction des 
consommations d’énergie finale dans des bâtiments à 
usage tertiaire a été publié.  

Il spécifie qu’**un coefficient de 0,77 sera appliqué aux 
consommations d’énergie des bâtiments raccordés aux 
réseaux de chaleur.** 

:::cartridge{theme="color" className="presentation-rcu-tertiaire-cartridge-conso"}
Se raccorder à un réseau de chaleur,  
c’est jusqu'à :  

**23%** de réduction de consommations d’énergie comptabilisée&nbsp;!  

(en fonction du mode de chauffage initial)
:::
`}
              className="presentation-rcu-tertiaire-body"
            />
          </Slice>

          <Slice theme="grey" padding={2}>
            <SliceForm />
          </Slice>

          <Slice
            theme="color"
            padding={8}
            header={`## Un moyen efficace de lutter contre le changement climatique`}
          >
            <SimulateurCO2 typeSurf="tertiaire">
              <MarkdownWrapper
                value={`
:::puce-icon{icon="./icons/picto-warning.svg"}
**À partir du 1er juillet 2022,** de nouvelles normes environnementales, 
qui visent à limiter les émissions de gaz à effet de serre, entreront en 
vigueur et **excluent l'installation de nouvelles chaudières au fioul.**  
**Des aides accompagnent cette transition.**
:::
              `}
              />
            </SimulateurCO2>
          </Slice>

          <Slice
            padding={4}
            className="slice-comparatif-rcu"
            header={`## Les réseaux de chaleur constituent en moyenne la solution de chauffage la plus compétitive pour les bâtiments tertiaires&nbsp;!`}
          >
            <WrappedBlock data={comparatifRcu} />
          </Slice>

          <Slice
            theme="grey"
            padding={7}
            header={`## Découvrez les dispositifs d’aides`}
            direction="row"
            className="aides-rcu"
          >
            <MarkdownWrapper
              value={`##### Vous souhaitez raccorder vos locaux à un réseau de chaleur&nbsp;?  

Le dispositif **[«&nbsp;Coup de pouce Chauffage des bâtiments 
tertiaires&nbsp;»](https://www.ecologie.gouv.fr/coup-pouce-chauffage-des-batiments-tertiaires)** 
a pour objectif d’inciter financièrement les 
propriétaires ou gestionnaires de bâtiments tertiaires à 
remplacer leurs équipements de chauffage au charbon, 
au fioul ou au gaz au profit d’un raccordement à un 
réseau de chaleur.  
              `}
              className="aides-rcu-body"
            />
            <MarkdownWrapper
              value={`##### Un accompagnement technique et financier peut aussi être sollicité&nbsp;:  

- Auprès de **[France Renov](https://france-renov.gouv.fr/fr/pro/quel-accompagnement-pour-mes-travaux)** 
pour le petit tertiaire privé (<1000 m²)  

- Dans le cadre du **[programme ACTEE](https://www.programme-cee-actee.fr/)** 
pour les bâtiments publics des collectivités  
              `}
              className="aides-rcu-body"
            />
          </Slice>

          <Slice padding={6}>
            <Accordions data={faqRcuTertiaire} />
          </Slice>
        </div>
      </MainContainer>
    </>
  );
}
