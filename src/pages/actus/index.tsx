import Article from '@components/Articles/Article';
import SimplePage from '@components/shared/page/SimplePage';
import Slice from '@components/Slice';
import { articles } from '@data/contents';

const Articles = () => {
  return (
    <SimplePage
      title="Nos actus - France Chaleur Urbaine"
      currentPage="/ressources"
    >
      <Slice padding={8}>
        <h1>Nos actus</h1>
        {articles.map((article) => (
          <div key={article.title} className="fr-mt-4w">
            <Article article={article} isHorizontal />
          </div>
        ))}
      </Slice>
    </SimplePage>
  );
};

export default Articles;
