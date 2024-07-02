import { articles } from '@data/contents';
// import { Icon, Link } from '@codegouvfr/react-dsfr';
import Article from './Article';
import { Articles, RemainingArticles } from './LastArticles.styles';
import Link from 'next/link';
import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';

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
        <div className="fr-mb-3w">
          {articles.slice(2, 6).map((article) => (
            <Box mb="1w" key={article.title}>
              <Link href={`/actus/${article.slug}`} className="fr-link">
                {article.title}
              </Link>
            </Box>
          ))}
        </div>
        <div>
          <Link href="/actus" className="fr-link">
            Voir toutes les actus
            <Icon name="ri-arrow-right-line" />
          </Link>
        </div>
      </RemainingArticles>
    </Articles>
  );
};

export default LastArticles;
