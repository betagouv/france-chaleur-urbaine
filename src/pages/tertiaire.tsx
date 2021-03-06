import Accordions from '@components/accordions';
import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import MainContainer from '@components/shared/layout';
import { GlobalStyle } from '@components/shared/layout/Global.style';
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
import { createGlobalStyle } from 'styled-components';

const TertiaireStyle = createGlobalStyle`
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

export default function Home() {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Un r??seau de chaleur est un syst??me de distribution de chaleur produite de fa??on centralis??e qui permet de desservir un grand nombre d???usagers (b??timents tertiaires publics ou priv??s, copropri??t??s, logements sociaux,...). Un des atouts majeurs des r??seaux de chaleur est de permettre de mobiliser les ??nergies renouvelables pr??sentes sur le territoire, difficilement distribuables autrement."
        />
        <title>
          France Chaleur Urbaine : Une solution num??rique qui facilite le
          raccordement ?? un chauffage ??conomique et ??cologique
        </title>
      </Head>

      <MainContainer currentMenu="/tertiaire">
        <div data-hidden={process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID}>
          <GlobalStyle />
          <TertiaireStyle />

          <HeadSliceForm
            bg="./img/head-slice-bg-tertiaire.png"
            pageBody={`
Vos locaux sont chauff??s au fioul ou au gaz&nbsp;?
# Optez pour un chauffage ??cologique et ??conomique`}
            formLabel="Votre b??timent peut-il ??tre raccord??&nbsp;?"
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
            header={`##### VOUS ??TES PROPRI??TAIRE OU EXPLOITANT  
##### D'UN ??TABLISSEMENT TERTIAIRE`}
            direction="row"
            className="presentation-rcu-tertiaire"
          >
            <MarkdownWrapper
              value={`
Vos b??timents pr??sentent une surface d???activit??s tertiaires (ou un 
cumul de surfaces) ??gale ou sup??rieure ?? 1 000 m??&nbsp;?  

**-> vous ??tes assujettis au dispositif ??co-??nergie tertiaire&nbsp;!**  

Pour atteindre les objectifs du dispositif, vous pouvez optimiser 
l'exploitation de vos b??timents, moderniser vos ??quipements, ou 
encore engager des travaux de r??novation ??nerg??tique.  

**C???est aussi le moment de changer votre mode de chauffage pour 
une solution moins ??mettrice de gaz ?? effet de serre&nbsp;!**

:::cartridge{theme="grey" className="presentation-rcu-tertiaire-cartridge"}
#### Obligation  

**de r??duction des consommations d?????nergie finale de l???ensemble 
du parc tertaire d???au moins :**  
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
Le 13 avril 2022, un arr??t?? modifiant celui du 10 avril 2020 
relatif aux obligations d???actions de r??duction des 
consommations d?????nergie finale dans des b??timents ?? 
usage tertiaire a ??t?? publi??.  

Il sp??cifie qu???**un coefficient de 0,77 sera appliqu?? aux 
consommations d?????nergie des b??timents raccord??s aux 
r??seaux de chaleur.** 

:::cartridge{theme="color" className="presentation-rcu-tertiaire-cartridge-conso"}
Se raccorder ?? un r??seau de chaleur,  
c???est jusqu'?? :  

**23%** de r??duction de consommations d?????nergie comptabilis??e&nbsp;!  

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
**?? partir du 1er juillet 2022,** de nouvelles normes environnementales, 
qui visent ?? limiter les ??missions de gaz ?? effet de serre, entreront en 
vigueur et **excluent l'installation de nouvelles chaudi??res au fioul.**  
**Des aides accompagnent cette transition.**
:::
              `}
              />
            </SimulateurCO2>
          </Slice>

          <Slice
            padding={4}
            className="slice-comparatif-rcu"
            header={`## Les r??seaux de chaleur constituent en moyenne la solution de chauffage la plus comp??titive pour les b??timents tertiaires&nbsp;!`}
          >
            <WrappedBlock data={comparatifRcu} />
          </Slice>

          <Slice
            theme="grey"
            padding={7}
            header={`## D??couvrez les dispositifs d???aides`}
            direction="row"
            className="aides-rcu"
          >
            <MarkdownWrapper
              value={`##### Vous souhaitez raccorder vos locaux ?? un r??seau de chaleur&nbsp;?  

Le dispositif **[??&nbsp;Coup de pouce Chauffage des b??timents 
tertiaires&nbsp;??](https://www.ecologie.gouv.fr/coup-pouce-chauffage-des-batiments-tertiaires)** 
a pour objectif d???inciter financi??rement les 
propri??taires ou gestionnaires de b??timents tertiaires ?? 
remplacer leurs ??quipements de chauffage au charbon, 
au fioul ou au gaz au profit d???un raccordement ?? un 
r??seau de chaleur.  
              `}
              className="aides-rcu-body"
            />
            <MarkdownWrapper
              value={`##### Un accompagnement technique et financier peut aussi ??tre sollicit??&nbsp;:  

- Aupr??s de **[France Renov](https://france-renov.gouv.fr/fr/pro/quel-accompagnement-pour-mes-travaux)** 
pour le petit tertiaire priv?? (<1000 m??)  

- Dans le cadre du **[programme ACTEE](https://www.programme-cee-actee.fr/)** 
pour les b??timents publics des collectivit??s  
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
