import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Partners from '@components/Partners/Partners';
import MainContainer from '@components/shared/layout';
import Slice, { SliceImg } from '@components/Slice';
import TextList from '@components/TextList';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { dataNumberRcu, presentationRcu } from '@data/home';
import Head from 'next/head';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .slice-migration-solution {
    background-repeat: no-repeat;
    background-position: right calc(50% - 25rem) bottom 50%;

    @media (min-width: 990px) {
      background-image: radial-gradient(circle, #EEF9FD 0%, #EEF9FD min(280px, 50vw), transparent min(280px, 50vw), transparent 100%);
    }

    .warning {
      @media (min-width: 990px) {
        padding-left: 13rem;
      }

      p {
        font-size: 1.1rem;
        font-size: 0.95rem;
        line-height: 1.8;
      }
    }
  }

  .slice-schema-container {
    background-repeat: no-repeat;
    background-position: right calc(50% - 28rem) bottom 50%;

    @media (min-width: 990px) {
      background-image: url(./img/rcu-illustation.svg) ;

      img {
        opacity: 0;
      }
    }

    .presentation-rcu-icon {
      &:first-of-type {
        margin-top: 3em;
      }
    }
  }

  .user-experience-description {
    position: relative;
    padding-left: 5.75em;
  }

  .enjeu-societe-description-wrapper {
    padding: 0 3rem;
  }
  .enjeu-societe-description--container {
    z-index: 1;
  }
  .enjeu-societe-description {
    margin-left: 2em;
    

    .list-item {
      max-width: 350px;
    }
  }
  .enjeu-societe-img {
    max-width: 122px;

    @media (max-width: 991px) {
      position: absolute;
      opacity: 0.25;
    }
  }
`;

const BlockquoteSlice = styled.div`
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;

  blockquote {
    margin: 0;
    font-weight: normal;
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

      <MainContainer currentMenu="/">
        <div data-hidden={process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID}>
          <GlobalStyle />

          <HeadSliceForm
            bg="./img/head-slice-bg-home.png"
            pageTitle="Les r??seaux de chaleur, une ??nergie d???avenir"
            pageBody="Un chauffage ??cologique ?? prix comp??titif d??j?? adopt?? par 6 millions de Fran??ais"
            formLabel="Votre immeuble pourrait-il ??tre raccord?? ?? un&nbsp;r??seau&nbsp;de&nbsp;chaleur&nbsp;?"
            CheckEligibility
          />

          <Slice padding={10} className="slice-schema-container">
            <WrappedText {...presentationRcu} />
          </Slice>

          <Slice theme="color" padding={5}>
            <BlockquoteSlice>
              <blockquote>
                ???Le d??r??glement climatique est d??j?? en cours. Si nous n???agissons
                pas maintenant <br />
                pour limiter ses cons??quences, nous le subirons de mani??re
                brutale.???
              </blockquote>
              Rapport du GIEC, f??vrier 2022
            </BlockquoteSlice>
          </Slice>

          <Slice
            theme="grey"
            padding={10}
            header={`## Le chauffage, un enjeu de soci??t??  

_France Chaleur Urbaine est un service public qui promeut les r??seaux de chaleur, afin  
de r??pondre ?? deux enjeux majeurs : la lutte contre le changement climatique et la  
ma??trise du tarif des ??nergies._`}
            direction="row"
          >
            <WrappedBlock
              className="enjeu-societe-description-wrapper"
              direction="column"
            >
              <MarkdownWrapper
                value={`
##### VOUS ??TES UN PARTICULIER OU  
##### PROPRIETAIRE DE B??TIMENTS TERTIAIRES`}
              />
              <WrappedText
                textClassName="enjeu-societe-description"
                body={`
::check-item[D??couvrez si un r??seau de chaleur passe pr??s de votre immeuble]
::check-item[Trouvez toutes les informations pour faire un raccordement]
::check-item[Soyez mis en relation avec le gestionnaire du r??seau le plus proche]

:button-link[Copropri??taire]{href="./coproprietaire"}
:button-link[Tertiaire]{href="./tertiaire"}
`}
                imgClassName="enjeu-societe-img"
                imgSrc="./img/enjeu-de-societe-particulier.svg"
                imgAlt="Portrait d???Anne"
                reverse={true}
              />
            </WrappedBlock>
            <WrappedBlock
              className="enjeu-societe-description-wrapper"
              direction="column"
            >
              <MarkdownWrapper
                value={`
##### VOUS ??TES UNE COLLECTIVIT?? OU UN  
##### EXPLOITANT DE R??SEAUX DE CHALEUR`}
              />
              <WrappedText
                textClassName="enjeu-societe-description"
                body={`
::check-item[Valoriser les informations de votre r??seau sur la cartographie France chaleur urbaine]
::check-item[D??couvrez les potentiels de raccordement sur votre territoire]
::check-item[Soyez mis en contact avec des copropri??taires et propri??taires de b??timents tertiaires qui souhaitent ??tre raccord??s]

:button-link[Collectivit??s/Exploitants]{href="./collectivites-et-exploitants"}
`}
                imgClassName="enjeu-societe-img"
                imgSrc="./img/enjeu-de-societe-exploitant.svg"
                imgAlt="Portrait d???Anne"
                reverse={true}
              />
            </WrappedBlock>
          </Slice>

          <Slice theme="color" padding={5}>
            <TextList data={dataNumberRcu} />
          </Slice>

          <Partners />
          <SliceImg src="./img/home-footer-bg.jpg" />
        </div>
      </MainContainer>
    </>
  );
}
