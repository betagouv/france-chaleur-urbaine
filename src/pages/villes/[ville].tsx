import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';

import City from '@components/Cities/City';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import SimplePage from '@components/shared/page/SimplePage';
import citiesData from '@data/villes/villes';

type ComponentProps = InferGetStaticPropsType<typeof getStaticProps>;

const PageVille: React.FC<ComponentProps> = ({ ville }) => {
  return (
    <SimplePage>
      <GlobalStyle />
      <City city={ville} />
    </SimplePage>
  );
};

export default PageVille;

export const getStaticProps = ((context) => {
  const ville = context.params?.ville as string | undefined;

  if (!ville || !citiesData[ville.toLowerCase()]) {
    return {
      notFound: true,
    };
  }

  return { props: { ville } };
}) satisfies GetStaticProps;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: Object.keys(citiesData).map((ville) => ({ params: { ville } })),
    fallback: 'blocking',
  };
};
