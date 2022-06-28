import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
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
  margin: 0.5em 0;
  font-size: 1.25rem;
  font-weight: bold;

  blockquote {
    font-weight: normal;
  }
`;

const textDataKey = dataNumberRcu.map(({ value, description }) => ({
  title: value,
  body: description,
}));

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

      <MainContainer currentMenu="/">
        <div data-hidden={process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID}>
          <GlobalStyle />

          <HeadSliceForm
            bg="./img/head-slice-bg-home.png"
            pageTitle="Les réseaux de chaleur, une énergie d’avenir"
            pageBody="Un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français"
            formLabel="Votre immeuble pourrait-il être raccordé à un&nbsp;réseau&nbsp;de&nbsp;chaleur&nbsp;?"
            CheckEligibility
          />

          <Slice padding={10} className="slice-schema-container">
            <WrappedText {...presentationRcu} />
          </Slice>

          <Slice theme="color" padding={5}>
            <BlockquoteSlice>
              <blockquote>
                “Le dérèglement climatique est déjà en cours. Si nous n’agissons
                pas maintenant <br />
                pour limiter ses conséquences, nous le subirons de manière
                brutale.”
              </blockquote>
              Rapport du GIEC, février 2022
            </BlockquoteSlice>
          </Slice>

          <Slice
            theme="grey"
            padding={10}
            header={`## Le chauffage, un enjeu de société  

_France Chaleur Urbaine est un service public qui promeut les réseaux de chaleur, afin  
de répondre à deux enjeux majeurs : la lutte contre le changement climatique et la  
maîtrise du tarif des énergies._`}
            direction="row"
          >
            <WrappedBlock
              className="enjeu-societe-description-wrapper"
              direction="column"
            >
              <MarkdownWrapper
                value={`
##### VOUS ÊTES UN PARTICULIER OU  
##### PROPRIETAIRE DE BÂTIMENTS TERTIAIRES`}
              />
              <WrappedText
                textClassName="enjeu-societe-description"
                body={`
::check-item[Découvrez si un réseau de chaleur passe près de votre immeuble]
::check-item[Trouvez toutes les informations pour faire un raccordement]
::check-item[Soyez mis en relation avec le gestionnaire du réseau le plus proche]

:button-link[Copropriétaire]{href="./coproprietaire"}
:button-link[Tertiaire]{href="./tertiaire"}
`}
                imgClassName="enjeu-societe-img"
                imgSrc="./img/enjeu-de-societe-particulier.svg"
                imgAlt="Portrait d’Anne"
                reverse={true}
              />
            </WrappedBlock>
            <WrappedBlock
              className="enjeu-societe-description-wrapper"
              direction="column"
            >
              <MarkdownWrapper
                value={`
##### VOUS ÊTES UNE COLLECTIVITÉ OU UN  
##### EXPLOITANT DE RÉSEAUX DE CHALEUR`}
              />
              <WrappedText
                textClassName="enjeu-societe-description"
                body={`
::check-item[Valoriser les informations de votre réseau sur la cartographie France chaleur urbaine]
::check-item[Découvrez les potentiels de raccordement sur votre territoire]
::check-item[Soyez mis en contact avec des copropriétaires et propriétaires de bâtiments tertiaires qui souhaitent être raccordés]

:button-link[Collectivités/Exploitants]{href="./collectivites-et-exploitants"}
`}
                imgClassName="enjeu-societe-img"
                imgSrc="./img/enjeu-de-societe-exploitant.svg"
                imgAlt="Portrait d’Anne"
                reverse={true}
              />
            </WrappedBlock>
          </Slice>

          <Slice theme="color" padding={5}>
            <TextList data={textDataKey} />
          </Slice>

          <SliceImg src="./img/home-footer-bg.jpg" />
        </div>
      </MainContainer>
    </>
  );
}
