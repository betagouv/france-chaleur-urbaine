import MainContainer from '@components/shared/layout';
import Tertiaire from '@components/Tertiaire';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
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
