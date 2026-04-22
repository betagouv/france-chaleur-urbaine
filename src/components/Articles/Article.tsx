import Card from '@/components/ui/Card';
import type { Article as ArticleType } from '@/types/Article';

const Article = ({ article, isHorizontal, titleAs = 'h3' }: { article: ArticleType; isHorizontal?: boolean; titleAs?: 'h4' | 'h3' }) => {
  return (
    <Card
      title={article.title}
      desc={`Publié le ${article.publishedDate.toLocaleDateString('fr-FR')}`}
      linkProps={{
        href: `/actus/${article.slug}`,
      }}
      postHogEventKey="home:news_clicked"
      postHogEventProps={{ element_name: article.slug }}
      imageUrl={article.image}
      imageAlt=""
      enlargeLink
      border
      background={false}
      size="sm"
      titleAs={titleAs}
      horizontal={isHorizontal}
    />
  );
};

export default Article;
