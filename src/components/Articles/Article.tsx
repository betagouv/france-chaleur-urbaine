import {
  Card,
  CardDescription,
  CardHeader,
  CardImage,
  CardTitle,
} from '@dataesr/react-dsfr';
import { ComponentProps } from 'react';
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
          <LazyCardImage src={article.image} alt="" />
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

/**
 * Version de l'image de Card qui active le lazy loading.
 */
const LazyCardImage = (props: ComponentProps<typeof CardImage>) => (
  <div className="fr-card__img">
    <img
      src={props.src}
      alt={props.alt}
      className="fr-responsive-img"
      loading="lazy"
    />
  </div>
);

// Permet au composant CardHeader de retrouver l'image
LazyCardImage.defaultProps = {
  __TYPE: 'CardImage',
};
