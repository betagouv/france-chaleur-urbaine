import Accordions from '@components/accordions';
import Carrousel from '@components/Carrousel';
import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import HeadSlice from '@components/HeadSlice';
import MainLayout from '@components/shared/layout/MainLayout';
import Slice from '@components/Slice';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import {
  accompagnementRcu,
  faqRcu,
  fcuSolutionForFutur,
  testimonies,
  userExperience,
} from '@data';
import Head from 'next/head';
import React from 'react';
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
      background-image: url(./img/rcu-illustation.png) ;

      img {
        opacity: 0;
      }
    }
  }

  .user-experience-description {
    position: relative;
    padding-left: 5.75em;
  }

  preTitle {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 1.25rem;
  }
`;

const TitleColorSlice = styled.h3`
  text-align: center;
  margin: 0.5em 0;
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
      <MainLayout currentMenu="/">
        <div data-hidden={process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID}>
          <GlobalStyle />

          <HeadSlice
            bg="./img/head-slice-bg-home.png"
            formLabel="Votre immeuble pourrait-il être raccordé à un&nbsp;réseau&nbsp;de&nbsp;chaleur&nbsp;?"
            pageTitle="Les réseaux de chaleur, une énergie d’avenir"
            pageBody="Un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français"
          />

          <Slice padding={4} className="slice-migration-solution">
            <WrappedBlock data={accompagnementRcu} />
          </Slice>

          <Slice theme="color" padding={5}>
            <TitleColorSlice>
              Comme plus de 5 millions de Français, <br />
              valorisez votre copropriété en optant <br />
              pour les réseaux de chaleur.
            </TitleColorSlice>
          </Slice>

          <Slice padding={4} className="slice-schema-container">
            <WrappedText {...fcuSolutionForFutur} />
          </Slice>

          <Slice
            theme="grey"
            padding={4}
            header={`## Ce que France Chaleur Urbaine peut faire pour vous  

_Les tarifs sont donnés à titre d’exemple en s’inspirant d’un cas réel_`}
          >
            {userExperience.map((props, i) => (
              <WrappedText
                key={`user-experience-${i}`}
                textClassName="user-experience-description"
                {...props}
              />
            ))}
          </Slice>

          <Slice padding={2}>
            <div className="fr-grid-row fr-grid-row--center fr-py-2w">
              <div className="fr-col-lg-6">
                <CheckEligibilityForm
                  formLabel="Votre logement est-il raccordable ?"
                  centredForm
                />
              </div>
            </div>
          </Slice>

          <Slice>
            <Carrousel
              title="Leur copropriété est raccordée - ils témoignent :"
              Testimonies={testimonies}
              imgSrc="./img/home-testimony.jpg"
              imgAlt="Portrait d’Isham et Sophie."
              imgCaption="Avec les réseaux de chaleur, Isham et Sophie sont fiers de contribuer à la transition énergétique."
            />
          </Slice>

          <Slice padding={6}>
            <Accordions data={faqRcu} />
          </Slice>
        </div>
      </MainLayout>
    </>
  );
}
