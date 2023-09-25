import MainContainer from '@components/shared/layout';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import { useRouter } from 'next/router';
import City from '@components/Cities/City';

const PageVille = () => {
  const router = useRouter();
  const city: string = router.query.ville as string;

  if (!city) {
    return null;
  }

  return (
    <MainContainer currentMenu={'/'}>
      <GlobalStyle />
      <City city={city} />
    </MainContainer>
  );
};

export default PageVille;
