import { Card } from '@codegouvfr/react-dsfr/Card';

import { Article as ArticleType } from 'src/types/Article';

const Article = ({ article, isHorizontal }: { article: ArticleType; isHorizontal?: boolean }) => {
  return (
    <Card
      title={article.title}
      desc={`Publié le ${article.publishedDate.toLocaleDateString('fr-FR')}`}
      linkProps={{
        href: `/actus/${article.slug}`,
      }}
      imageUrl={article.image}
      imageAlt=""
      enlargeLink
      border
      background={false}
      size="small"
      titleAs="h4"
      horizontal={isHorizontal}
    />
  );
};

export default Article;
