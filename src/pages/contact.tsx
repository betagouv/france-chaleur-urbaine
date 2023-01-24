import MainContainer from '@components/shared/layout';
import Slice from '@components/Slice';
import Head from 'next/head';

function contact() {
  return (
    <>
      <Head>
        <title>Contact : France Chaleur Urbaine</title>
      </Head>
      <MainContainer currentMenu="/contact">
        <Slice padding={4}>
          <h1>Comment nous contacter ?</h1>
          <p>
            Vous avez une question, une proposition pour améliorer ce service ou
            rencontrez un problème sur le site ?
          </p>
          <p>
            Vous pouvez nous contacter par courriel à l'adresse :{' '}
            <a
              href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
              target="_blank"
              rel="noreferrer"
            >
              france-chaleur-urbaine@developpement-durable.gouv.fr
            </a>
          </p>
        </Slice>
      </MainContainer>
    </>
  );
}

export default contact;
