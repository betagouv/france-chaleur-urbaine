import MainContainer from '@components/shared/layout';
import Tertiaire from '@components/Tertiaire';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Raccorder son bâtiment au réseau de chaleur, c’est jusqu’à 23 % de réduction de consommations d’énergie comptabilisée ! En application de l’arrêté du 13 avril 2022 relatif aux obligations d’actions de réduction des consommations d’énergie finale dans des bâtiments à usage tertiaire, un coefficient de 0,77 est appliqué aux calculs des consommations d’énergie des bâtiments raccordés aux réseaux de chaleur."
        />
        <title>
          Décret tertiaire : atteignez vos objectifs de perfomance énergétique
          en raccordant votre bâtiment au chauffage urbain
        </title>
      </Head>

      <MainContainer currentMenu="/tertiaire">
        <Tertiaire alt />
      </MainContainer>
    </>
  );
}
