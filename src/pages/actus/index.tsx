import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { articles } from '@data/contents';
import Image from 'next/image';

const Articles = () => {
  return (
    <SimplePage
      title="Nos actus - France Chaleur Urbaine"
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
              Nos actualités
            </Heading>
            <Text size="lg" mb="3w">
              France Chaleur Urbaine est un service en évolution permanente !
              Retrouvez ici toutes nos actualités : évolutions du site,
              campagnes de communication, nouveaux support pédagogiques,...
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
        <Box className="fr-grid-row fr-grid-row--gutters">
          {articles.map((article, index) => (
            <div
              className="fr-col fr-col-12 fr-col-sm-6 fr-col-md-4"
              key={index}
            >
              <div className="fr-card fr-enlarge-link">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h3 className="fr-card__title">
                      <Box textColor="text-title-blue-france">
                        <Link href={`/actus/${article.slug}`}>
                          {article.title}
                        </Link>
                      </Box>
                    </h3>
                    <p className="fr-card__desc">
                      {getArticleAbstract(article.content)}
                    </p>

                    <div className="fr-card__start">
                      {/* not yet available */}
                      {/* <ul className="fr-tags-group">
                        <li>
                          <p className="fr-tag">Reportage</p>
                        </li>
                        <li>
                          <p className="fr-tag">Énergie renouvelable</p>
                        </li>
                      </ul> */}

                      <p className="fr-card__detail fr-icon-arrow-right-line">
                        Publié le{' '}
                        {article.publishedDate.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="fr-card__header">
                  <div className="fr-card__img">
                    <img
                      className="fr-responsive-img"
                      src={article.image}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Box>
      </Box>
    </SimplePage>
  );
};

export default Articles;

const markdownLinksRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Get the abstract of an article (markdown). Skip the title.
 */
function getArticleAbstract(content: string): string {
  const line = (
    content
      .split('\n')
      .slice(1)
      .find((line) => line !== '' && !line.startsWith('#')) ?? ''
  )
    .replaceAll(markdownLinksRegex, (match, title) => title)
    .replaceAll(/[\\_*]/g, '');
  return line.length < 150 ? line : `${line.substring(0, 150)}...`;
}
