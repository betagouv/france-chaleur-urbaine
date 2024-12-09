import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import { GetStaticPaths, GetStaticProps } from 'next';
import styled from 'styled-components';

import MarkdownWrapper from '@/components/MarkdownWrapper';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import { articles, getArticle } from '@/data/contents';
import { Article } from '@/types/Article';

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

const ActualitePage: React.FC<{ article: Article }> = ({ article }) => {
  const lines = article?.content?.split('\n') ?? [];
  const title = lines.slice(0, 1)?.[0]?.substring(1); // remove the hashtag
  const content = lines.slice(1).join('\n');

  return (
    <SimplePage
      currentPage="/actus"
      title={title}
      description={article.abstract}
      microdata={[
        {
          '@type': 'NewsArticle',
          headline: title,
          description: article.abstract,
          image: [article.image],
          datePublished: new Date(article?.publishedDate).toISOString(),
        },
      ]}
    >
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
            Publié le {new Date(article?.publishedDate).toLocaleDateString('fr-FR')}
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
        <MarkdownWrapper value={content} color="black" />
      </ArticleContentWrapper>
    </SimplePage>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const article = getArticle(slug);

  if (!article) {
    return {
      redirect: {
        destination: `/actus?notify=error:${encodeURIComponent("Désolé, cette actualité n'existe pas.")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      article: JSON.parse(JSON.stringify(article)) as typeof article,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = articles.map(({ slug }) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export default ActualitePage;
