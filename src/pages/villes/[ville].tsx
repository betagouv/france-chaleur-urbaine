import { GlobalStyle } from '@components/shared/layout/Global.style';
import { useRouter } from 'next/router';
import City from '@components/Cities/City';
import SimplePage from '@components/shared/page/SimplePage';

const PageVille = () => {
  const router = useRouter();
  const city: string = router.query.ville as string;

  if (!city) {
    return null;
  }

  return (
    <SimplePage>
      <GlobalStyle />
      <City city={city} />
    </SimplePage>
  );
};

export default PageVille;
