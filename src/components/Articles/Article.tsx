import {
  Card,
  CardDescription,
  CardHeader,
  CardImage,
  CardTitle,
} from '@dataesr/react-dsfr';
import { Article as ArticleType } from 'src/types/Article';

const Article = ({
  article,
  isHorizontal,
}: {
  article: ArticleType;
  isHorizontal?: boolean;
}) => {
  return (
    <>
      {/* ici warning Invalid argument supplied to oneOfType. Expected an array of check functions, but received undefined at index 1. */}
      <Card
        isHorizontal={isHorizontal}
        href={`/actus/${article.slug}`}
        size="sm"
      >
        <CardHeader>
          <CardImage src={article.image}></CardImage>
        </CardHeader>
        <CardTitle>{article.title}</CardTitle>
        <CardDescription>
          Publié le {article.publishedDate.toLocaleDateString('fr-FR')}
        </CardDescription>
      </Card>
    </>
  );
};

export default Article;
