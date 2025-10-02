import { Card } from '@codegouvfr/react-dsfr/Card';

import type { Article as ArticleType } from '@/types/Article';

const Article = ({ article, isHorizontal, titleAs = 'h3' }: { article: ArticleType; isHorizontal?: boolean; titleAs?: 'h4' | 'h3' }) => {
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
      titleAs={titleAs}
      horizontal={isHorizontal}
    />
  );
};

export default Article;
