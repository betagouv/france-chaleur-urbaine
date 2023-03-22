import { articles } from '@data/contents';
import { Icon, Link } from '@dataesr/react-dsfr';
import Article from './Article';
import { Articles, RemainingArticles } from './LastArticles.styles';

const LastArticles = () => {
  return (
    <Articles className="fr-grid-row--gutters">
      <div className="fr-col-12 fr-col-lg-4">
        <Article article={articles[0]} />
      </div>
      <div className="fr-col-12 fr-col-lg-4">
        <Article article={articles[1]} />
      </div>
      <RemainingArticles className="fr-col-12 fr-col-lg-4 fr-py-3w">
        <div className="fr-mb-4w">
          {articles.slice(2).map((article) => (
            <Link
              key={article.title}
              isSimple
              as={
                <div>
                  <Link href={`/articles/${article.slug}`}>
                    {article.title}
                  </Link>
                </div>
              }
            />
          ))}
        </div>
        <div>
          <Link
            isSimple
            as={
              <Link href="/articles">
                <>
                  Voir tous les articles <Icon name="ri-arrow-right-line" />
                </>
              </Link>
            }
          />
        </div>
      </RemainingArticles>
    </Articles>
  );
};

export default LastArticles;
