import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { articles } from '@data/contents';
import Image from 'next/image';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useMemo } from 'react';

const themes = [
  ...articles
    .reduce((acc, article) => {
      article.themes.forEach((theme) => {
        acc.add(theme);
      });
      return acc;
    }, new Set<string>())
    .keys(),
].sort();

const Articles = () => {
  const [selectedThemes, setSelectedThemes] = useQueryState(
    'themes',
    parseAsArrayOf(parseAsString).withDefault([])
  );

  function toggleTheme(theme: string) {
    setSelectedThemes(
      selectedThemes?.includes(theme)
        ? selectedThemes?.filter((t) => t !== theme)
        : [...selectedThemes, theme]
    );
  }

  const filteredActus = useMemo(() => {
    return selectedThemes.length === 0
      ? articles
      : articles.filter((article) =>
          article.themes.some((articleTheme) =>
            selectedThemes.includes(articleTheme)
          )
        );
  }, [selectedThemes]);

  return (
    <SimplePage title="Nos actualités - France Chaleur Urbaine">
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
              Nos actualités
            </Heading>
            <Text size="lg" mb="3w">
              France Chaleur Urbaine est un service en évolution
              permanente&nbsp;!
              <br />
              Retrouvez ici toutes nos actualités.
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
        <Box className="fr-grid-row fr-grid-row--gutters">
          <Box className="fr-col-12 fr-col-md-3">
            <Heading as="h2" color="blue-france">
              {filteredActus.length} actu{filteredActus.length > 2 && 's'}
            </Heading>
            <Box
              minHeight="1px"
              backgroundColor="blue-france-sun-113-625"
              my="3w"
            />
            <Heading as="h4" color="blue-france">
              Filtrer par catégorie
            </Heading>

            <ul className="fr-tags-group">
              {themes.map((theme, index) => (
                <button
                  className="fr-tag"
                  aria-pressed={selectedThemes?.includes(theme)}
                  onClick={() => toggleTheme(theme)}
                  key={index}
                >
                  {theme}
                </button>
              ))}
            </ul>
          </Box>

          <Box className="fr-col fr-grid-row fr-grid-row--gutters">
            {filteredActus.map((article) => (
              <div
                className="fr-col-12 fr-col-sm-6 fr-col-md-6 fr-col-lg-4"
                key={article.slug}
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
                        <ul className="fr-tags-group">
                          {article.themes.map((theme, index) => (
                            <li key={index} className="fr-tag">
                              {theme}
                            </li>
                          ))}
                        </ul>

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
