import Accordions from '@components/accordions';
import faqRcu from '@components/accordions/faq-rcu';
import Banner from '@components/banner/banner';
import Carrousel from '@components/Carrousel';
import testimonies from '@components/Carrousel/testimonies.json';
import HighlightList from '@components/HighlightList';
import accompagnementRcu from '@components/HighlightList/accompagnement-rcu.json';
import atoutsRcu from '@components/HighlightList/atouts-rcu.json';
import MainLayout from '@components/shared/layout/MainLayout';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import dataNumberRcu from '@components/TextList/data-number-rcu.json';
import WrappedText from '@components/WrappedText';
import Head from 'next/head';
import React from 'react';

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
      <MainLayout>
        <div data-hidden={process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID}>
          <Slice theme="grey">
            <Banner />
          </Slice>
          <Slice>
            <WrappedText />
          </Slice>
          <Slice>
            <HighlightList
              title={`Les nombreux atouts des
réseaux de chaleur`}
              data={atoutsRcu}
            />
          </Slice>
          <Slice theme="color">
            <TextList data={textDataKey} />
          </Slice>
          <Slice>
            <HighlightList
              title="France Chaleur Urbaine, vous accompagne gratuitement :"
              data={accompagnementRcu}
            />
          </Slice>
          <Slice>
            <Accordions data={faqRcu} />
          </Slice>
          <Slice theme="grey">
            <Carrousel
              title="Leur copropriété est raccordée - ils témoignent :"
              Testimonies={testimonies}
              imgSrc="./img-testimony.jpg"
              imgAlt="Reseau de chaleur urbaine"
            />
          </Slice>
        </div>
      </MainLayout>
    </>
  );
}
