import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';

import { getRessource, ressourceKeys } from '@components/Ressources/config';
import Ressource from '@components/Ressources/Ressource';
import SimplePage from '@components/shared/page/SimplePage';

const RessourcePage = ({ ressource, ressourceName }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <SimplePage currentPage="/ressources" title={ressource.title} description={ressource.seoDescription}>
      <Ressource ressourceKey={ressourceName} />
    </SimplePage>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const ressourceName = params?.ressource as keyof typeof ressourceKeys;
  // description is a react component sent from server and thus will make static rendering fail so remove it from the fields
  // Another solution could be to convert it to a string on server with ReactDOM or use Markdown string
  const { description, content, ...ressource } = getRessource(ressourceName) || {};

  if (!ressource.title) {
    return {
      notFound: true,
    };
  }

  return {
    props: { ressource, ressourceName },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = ressourceKeys.map((ressource) => ({
    params: { ressource },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export default RessourcePage;
