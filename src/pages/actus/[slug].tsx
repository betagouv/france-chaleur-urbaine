import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import MarkdownWrapper from '@components/MarkdownWrapper';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import { getArticle } from '@data/contents';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Article } from 'src/types/Article';
import styled from 'styled-components';

const ArticleContentWrapper = styled(Box)`
  img {
    max-width: 100%;
  }
  a {
    word-break: break-word;
  }
  em {
    color: inherit;
    font-style: italic;
  }
`;

const ThemeTagItem = styled.li`
  background-color: var(--blue-france-sun-113-625) !important;
  color: white !important;
  line-height: 1.8em !important;
`;

const ActualitePage = () => {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (!router.query.slug) {
      return;
    }

    const article = getArticle(router.query.slug as string);
    if (article) {
      setArticle(article);
    } else {
      router.push('/actus');
    }
  }, [router.query]);

  const lines = article?.content?.split('\n') ?? [];
  const title = lines.slice(0, 1)?.[0]?.substring(1); // remove the hashtag
  const content = lines.slice(1).join('\n');

  return (
    <SimplePage currentPage="/ressources" title={title}>
      <Box className="fr-container fr-mb-n2w fr-mb-md-n4w">
        <Breadcrumb
          currentPageLabel={title}
          homeLinkProps={{
            href: '/',
          }}
          segments={[
            {
              label: 'Nos actualités',
              linkProps: {
                href: '/actus',
              },
            },
          ]}
        />
      </Box>

      <Box backgroundColor="blue-cumulus-950-100">
        <Box maxWidth="1000px" mx="auto" pt="8w" pb="4w" px="2w">
          <Heading size="h1" color="blue-france" mb="0">
            {title}
          </Heading>

          <Text className="fr-icon-arrow-right-line" my="2w">
            Publié le {article?.publishedDate.toLocaleDateString('fr-FR')}
          </Text>

          <ul className="fr-tags-group">
            {article?.themes.map((theme, index) => (
              <ThemeTagItem key={index} className="fr-tag">
                {theme}
              </ThemeTagItem>
            ))}
          </ul>
        </Box>
      </Box>

      <ArticleContentWrapper pt="5w" pb="10w" className="fr-container">
        <MarkdownWrapper value={content} />
      </ArticleContentWrapper>
    </SimplePage>
  );
};

export default ActualitePage;
