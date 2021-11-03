import Adventage from '@components/adventage/adventage';
import HowIsItWorking from '@components/howIsItWorking/howIsItWorking';
import MainLayout from '@components/shared/layout/MainLayout';
import Slice from '@components/Slice';
import Testimony from '@components/testimony/testimony';
import Head from 'next/head';
import React from 'react';

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
      <MainLayout banner={true}>
        <div data-hidden={process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID}>
          <Slice>
            <Adventage />
          </Slice>

          <Slice pattern="color">
            <HowIsItWorking />
          </Slice>

          <Slice pattern="grey">
            <Testimony />
          </Slice>
        </div>
      </MainLayout>
    </>
  );
}
