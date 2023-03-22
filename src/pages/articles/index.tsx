import MainContainer from '@components/shared/layout/MainContainer';
import Slice from '@components/Slice';
import { articles } from '@data/contents';
import { Card, CardHeader, CardImage, CardTitle } from '@dataesr/react-dsfr';

const Articles = () => {
  return (
    <MainContainer currentMenu="/articles">
      <Slice padding={8}>
        <h1>Nos articles</h1>
        {articles.map((article) => (
          <Card
            key={article.title}
            isHorizontal
            href={`/articles/${article.slug}`}
            className="fr-mt-4w"
          >
            <CardHeader>
              <CardImage src={article.image}></CardImage>
            </CardHeader>
            <CardTitle>{article.title}</CardTitle>
          </Card>
        ))}
      </Slice>
    </MainContainer>
  );
};

export default Articles;
