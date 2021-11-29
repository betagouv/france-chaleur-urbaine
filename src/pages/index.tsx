import Accordions from '@components/accordions';
import faqRcu from '@components/accordions/faq-rcu';
import Banner from '@components/banner/banner';
import Carrousel from '@components/Carrousel';
import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import HighlightList from '@components/HighlightList';
import MainLayout from '@components/shared/layout/MainLayout';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import WrappedText from '@components/WrappedText';
import {
  accompagnementRcu,
  dataNumberRcu,
  fcuSolutionForFutur,
  testimonies,
  userExperience,
} from '@data';
import Head from 'next/head';
import React from 'react';
import { createGlobalStyle } from 'styled-components';

const textDataKey = dataNumberRcu.map(({ value, description }) => ({
  title: value,
  body: description,
}));

const GlobalStyle = createGlobalStyle`
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

          <Slice
            theme="grey"
            bg="./img/home-top-search-bg.jpg"
            bgWidth={1600}
            bgColor="#88c9df"
            bleedColor={['#41a4c1', '#88c9df']}
          >
            <Banner />
          </Slice>

          <Slice padding={4} className="slice-schema-container">
            <WrappedText {...fcuSolutionForFutur} />
          </Slice>

          <Slice theme="color" padding={3}>
            <TextList data={textDataKey} />
          </Slice>

          <Slice padding={4}>
            <HighlightList
              title="France Chaleur Urbaine, vous accompagne gratuitement :"
              data={accompagnementRcu}
            />
          </Slice>

          <Slice
            theme="grey"
            padding={4}
            header={`## Découvrez l’exemple de Anne,
## accompagnée par France Chaleur Urbaine

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
