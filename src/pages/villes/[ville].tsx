import { type GetStaticPaths, type GetStaticProps, type InferGetStaticPropsType } from 'next';

import City from '@/components/Cities/City';
import { GlobalStyle } from '@/components/shared/layout/Global.style';
import SimplePage from '@/components/shared/page/SimplePage';
import citiesData from '@/data/villes/villes';
import { getNetwork } from '@/modules/reseaux/server/service';
import { deepCloneJSON } from '@/utils/objects';

type ComponentProps = InferGetStaticPropsType<typeof getStaticProps>;

const PageVille: React.FC<ComponentProps> = ({ cityData, network }) => {
  return (
    <SimplePage
      title={`Chauffage urbain à ${cityData.name}`}
      description={
        cityData.networksData.identifiant
          ? `Découvrez le réseau de chaleur ${cityData.preposition}${cityData.nameNetwork}, une alternative écologique aux chaudières gaz et fioul, à prix maîtrisés.`
          : `Découvrez les réseaux de chaleur ${cityData.preposition}${cityData.nameNetwork}, une alternative écologique aux chaudières gaz et fioul, à prix maîtrisés.`
      }
    >
      <GlobalStyle />
      <City citySlug={cityData.slug} network={network} />
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
  let network: Awaited<ReturnType<typeof getNetwork>> | null = null;

  if (cityData.networksData?.identifiant && process.env.GITHUB_CI !== 'true') {
    network = await getNetwork(cityData.networksData?.identifiant);
  }

  return {
    props: {
      cityData: deepCloneJSON(cityData),
      network,
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
