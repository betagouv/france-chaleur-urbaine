import Article from '@components/Articles/Article';
import MainContainer from '@components/shared/layout/MainContainer';
import Slice from '@components/Slice';
import { articles } from '@data/contents';

const Articles = () => {
  return (
    <MainContainer currentMenu="/actus">
      <Slice padding={8}>
        <h1>Nos actus</h1>
        {articles.map((article) => (
          <div key={article.title} className="fr-mt-4w">
            <Article article={article} isHorizontal />
          </div>
        ))}
      </Slice>
    </MainContainer>
  );
};

export default Articles;
