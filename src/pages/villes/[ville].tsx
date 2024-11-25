import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';

import City from '@components/Cities/City';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import SimplePage from '@components/shared/page/SimplePage';
import citiesData from '@data/villes/villes';

type ComponentProps = InferGetStaticPropsType<typeof getStaticProps>;

const PageVille: React.FC<ComponentProps> = ({ cityData }) => {
  return (
    <SimplePage
      title={`Chauffage urbain à ${cityData.name}`}
      description={
        cityData.networksData.identifiant
          ? `Découvrez votre réseau de chaleur ${cityData.preposition} ${cityData.name}, une solution écologique et économique`
          : `Découvrez vos réseaux de chaleur ${cityData.preposition} ${cityData.name}, une solution écologique et économique`
      }
    >
      <GlobalStyle />
      <City city={cityData.slug} />
    </SimplePage>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const ville = (params?.ville as string)?.toLowerCase();
  // description is a react component sent from server and thus will make static rendering fail so remove it from the fields
  // Another solution could be to convert it to a string on server with ReactDOM or use Markdown string
  const { description, ...cityData } = citiesData[ville as keyof typeof citiesData] || {};

  if (!cityData.slug) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      cityData: JSON.parse(JSON.stringify(cityData)) as typeof cityData,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = Object.keys(citiesData).map((city) => ({
    params: { ville: city },
  }));

  return {
    paths,
    fallback: false,
  };
};

export default PageVille;
