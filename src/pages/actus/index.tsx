import Card from '@codegouvfr/react-dsfr/Card';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import { articles } from '@/data/contents';
import { formatFrenchSpacing } from '@/utils/strings';

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

const ActualitesPage = () => {
  const [selectedThemes, setSelectedThemes] = useQueryState('themes', parseAsArrayOf(parseAsString).withDefault([]));

  function toggleTheme(theme: string) {
    void setSelectedThemes(selectedThemes?.includes(theme) ? selectedThemes?.filter((t) => t !== theme) : [...selectedThemes, theme]);
  }

  const filteredActus = useMemo(() => {
    return selectedThemes.length === 0
      ? articles
      : articles.filter((article) => article.themes.some((articleTheme) => selectedThemes.includes(articleTheme)));
  }, [selectedThemes]);

  return (
    <SimplePage
      title="Nos actualités sur le chauffage urbain"
      description="Cartographie et données, Communication, ENR&R, Infographie, Prix, Reportage, Réglementation, Réseaux de chaleur, Réseaux de froid, ..."
    >
      <Hero variant="ressource" imageType="inline" image="/img/ressources_header.webp" imageClassName="py-5" imagePosition="right">
        <HeroTitle>Nos actualités</HeroTitle>
        <HeroSubtitle>
          France Chaleur Urbaine est un service en évolution permanente&nbsp;!
          <br />
          Retrouvez ici toutes nos actualités.
        </HeroSubtitle>
      </Hero>

      <Box py="10w" className="fr-container">
        <Box className="fr-grid-row fr-grid-row--gutters">
          <Box className="fr-col-12 fr-col-md-3">
            <Heading as="h2" color="blue-france">
              {filteredActus.length} actu{filteredActus.length > 2 && 's'}
            </Heading>
            <Box minHeight="1px" backgroundColor="blue-france-sun-113-625" my="3w" />
            <Heading as="h4" color="blue-france">
              Filtrer par catégorie
            </Heading>

            <ul className="fr-tags-group">
              {themes.map((theme, index) => (
                <button className="fr-tag" aria-pressed={selectedThemes?.includes(theme)} onClick={() => toggleTheme(theme)} key={index}>
                  {theme}
                </button>
              ))}
            </ul>
          </Box>

          <Box className="fr-col fr-grid-row fr-grid-row--gutters">
            {filteredActus.map((article) => (
              <div className="fr-col-12 fr-col-sm-6 fr-col-md-6 fr-col-lg-4" key={article.slug}>
                <Card
                  background
                  border
                  desc={article.abstract}
                  enlargeLink
                  imageAlt=""
                  imageUrl={article.image}
                  linkProps={{
                    href: `/actus/${article.slug}`,
                  }}
                  nativeImgProps={{
                    loading: 'lazy',
                  }}
                  size="medium"
                  start={
                    <ul className="fr-tags-group">
                      {article.themes.map((theme, index) => (
                        <Box as="li" key={index} lineHeight="1em !important">
                          <Tag small>{theme}</Tag>
                        </Box>
                      ))}
                    </ul>
                  }
                  title={formatFrenchSpacing(article.title)}
                  titleAs="h3"
                  detail={
                    <Box as="span" iconLeft="fr-icon-arrow-right-line">
                      Publié le {article.publishedDate.toLocaleDateString('fr-FR')}
                    </Box>
                  }
                />
              </div>
            ))}
          </Box>
        </Box>
      </Box>
    </SimplePage>
  );
};

export default ActualitesPage;
