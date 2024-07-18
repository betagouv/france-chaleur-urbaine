import Card from '@codegouvfr/react-dsfr/Card';
import {
  coldNetworks,
  growths,
  issues,
  understandings,
} from '@components/Ressources/config';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import Image from 'next/image';
import { ReactNode } from 'react';

const articlesEnjeuxReseauxDeChaleur: ArticleItemProps[] = Object.entries(
  issues
).map(([key, article]) => ({
  ...article,
  slug: key,
}));

const articlesComprendreReseauxDeChaleur: ArticleItemProps[] = Object.entries(
  understandings
).map(([key, article]) => ({
  ...article,
  slug: key,
}));

const articlesCroissance: ArticleItemProps[] = Object.entries(growths).map(
  ([key, article]) => ({
    ...article,
    slug: key,
  })
);

const articlesReseauxDeFroid: ArticleItemProps[] = Object.entries(
  coldNetworks
).map(([key, article]) => ({
  ...article,
  slug: key,
}));

const ArticlesPage = () => {
  return (
    <SimplePage title="Nos articles - France Chaleur Urbaine">
      <Box backgroundColor="blue-cumulus-950-100">
        <Box
          display="flex"
          gap="16px"
          maxWidth="1000px"
          mx="auto"
          pt="8w"
          px="2w"
        >
          <Box flex>
            <Heading size="h1" color="blue-france">
              Nos articles sur le chauffage urbain
            </Heading>
            <Text size="lg" mb="3w">
              Retrouvez les réponses à toutes vos questions sur les réseaux de
              chaleur et de froid.
            </Text>
          </Box>

          <Box className="fr-hidden fr-unhidden-lg">
            <Image
              src="/img/ressources_header.webp"
              alt=""
              width={152}
              height={180}
              priority
            />
          </Box>
        </Box>
      </Box>

      <Box py="10w" className="fr-container">
        <Heading
          as="h2"
          color="blue-france"
          mb="6w"
          center
          maxWidth="600px"
          mx="auto"
        >
          Les enjeux de la transition énergétique avec les réseaux de chaleur
        </Heading>
        <Box className="fr-grid-row fr-grid-row--gutters">
          {articlesEnjeuxReseauxDeChaleur.map((article, index) => (
            <ArticleItem {...article} key={index} />
          ))}
        </Box>
      </Box>

      <Box backgroundColor="blue-france-975-75">
        <Box py="10w" className="fr-container">
          <Heading
            as="h2"
            color="blue-france"
            mb="6w"
            center
            maxWidth="600px"
            mx="auto"
          >
            Les réseaux de chaleur en pratique&nbsp;: tout comprendre pour se
            raccorder
          </Heading>
          <Box className="fr-grid-row fr-grid-row--gutters">
            {articlesComprendreReseauxDeChaleur.map((article, index) => (
              <ArticleItem {...article} key={index} />
            ))}
          </Box>
        </Box>
      </Box>

      <Box py="10w" className="fr-container">
        <Heading as="h2" color="blue-france" mb="6w" center>
          Une filière en pleine croissance
        </Heading>
        <Box className="fr-grid-row fr-grid-row--gutters">
          {articlesCroissance.map((article, index) => (
            <ArticleItem {...article} key={index} />
          ))}
        </Box>
      </Box>

      <Box backgroundColor="blue-france-975-75">
        <Box py="10w" className="fr-container">
          <Heading as="h2" color="blue-france" mb="6w" center>
            Les réseaux de froid&nbsp;: un enjeu pour l'avenir
          </Heading>
          <Box className="fr-grid-row fr-grid-row--gutters">
            {articlesReseauxDeFroid.map((article, index) => (
              <ArticleItem {...article} key={index} />
            ))}
          </Box>
        </Box>
      </Box>
    </SimplePage>
  );
};

export default ArticlesPage;

interface ArticleItemProps {
  title: string;
  description: string | ReactNode;
  slug: string;
}

const ArticleItem = ({ title, description, slug }: ArticleItemProps) => (
  <div className="fr-col fr-col-12 fr-col-sm-6 fr-col-md-4">
    <Card
      background
      border
      desc={description}
      enlargeLink
      linkProps={{
        href: `/ressources/${slug}`,
      }}
      size="medium"
      title={title}
      titleAs="h3"
    />
  </div>
);
