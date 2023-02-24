import ContactForm from '@components/ContactForm';
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
          <ContactForm />
        </Slice>
      </MainContainer>
    </>
  );
}

export default contact;
