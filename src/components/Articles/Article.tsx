import { Card, CardHeader, CardImage, CardTitle } from '@dataesr/react-dsfr';
import { Article as ArticleType } from 'src/types/Article';

const Article = ({
  article,
  isHorizontal,
}: {
  article: ArticleType;
  isHorizontal?: boolean;
}) => {
  return (
    <Card isHorizontal={isHorizontal} href={`/actus/${article.slug}`}>
      <CardHeader>
        <CardImage src={article.image}></CardImage>
      </CardHeader>
      <CardTitle>{article.title}</CardTitle>
    </Card>
  );
};

export default Article;
