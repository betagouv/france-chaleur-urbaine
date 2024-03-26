import {
  coldNetworks,
  growths,
  issues,
  understandings,
} from '@components/Ressources/config';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
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

const OutilsPage = () => {
  return (
    <SimplePage
      title="Nos Articles - France Chaleur Urbaine"
      currentPage="/ressources"
    >
      <Box backgroundColor="blue-cumulus-950-100">
        <Box
          className="fr-container"
          display="flex"
          alignItems="center"
          gap="16px"
          px="16w"
          pt="8w"
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

      <Box p="10w" className="fr-container">
        <Heading size="h2" color="blue-france" mb="6w" center>
          Les enjeux de la transition énergétique avec les réseaux de chaleur
        </Heading>
        <Box className="fr-grid-row fr-grid-row--gutters">
          {articlesEnjeuxReseauxDeChaleur.map((article, index) => (
            <ArticleItem {...article} key={index} />
          ))}
        </Box>
      </Box>

      <Box backgroundColor="blue-france-975-75">
        <Box p="10w" className="fr-container">
          <Heading size="h3" color="blue-france" mb="6w" center>
            Les réseaux de chaleur en pratique : tout comprendre pour se
            raccorder
          </Heading>
          <Box className="fr-grid-row fr-grid-row--gutters">
            {articlesComprendreReseauxDeChaleur.map((article, index) => (
              <ArticleItem {...article} key={index} />
            ))}
          </Box>
        </Box>
      </Box>

      <Box p="10w" className="fr-container">
        <Heading size="h2" color="blue-france" mb="6w" center>
          Une filière en pleine croissance
        </Heading>
        <Box className="fr-grid-row fr-grid-row--gutters">
          {articlesCroissance.map((article, index) => (
            <ArticleItem {...article} key={index} />
          ))}
        </Box>
      </Box>

      <Box backgroundColor="blue-france-975-75">
        <Box p="10w" className="fr-container">
          <Heading size="h3" color="blue-france" mb="6w" center>
            Les réseaux de froid : un enjeu pour l'avenir
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

export default OutilsPage;

interface ArticleItemProps {
  title: string;
  description: string | ReactNode;
  slug: string;
}

const ArticleItem = ({ title, description, slug }: ArticleItemProps) => (
  <div className="fr-col fr-col-12 fr-col-sm-6 fr-col-md-4">
    <div className="fr-card fr-enlarge-link">
      <div className="fr-card__body">
        <div className="fr-card__content">
          <h3 className="fr-card__title">
            <Box textColor="text-title-blue-france">
              <Link href={`/ressources/${slug}`}>{title}</Link>
            </Box>
          </h3>
          <p className="fr-card__desc">{description}</p>
          <div className="fr-card__end">
            <p className="fr-card__detail">
              Lire l'article
              <span className="fr-icon--sm fr-icon-arrow-right-line fr-ml-1w" />
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
