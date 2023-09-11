import MarkdownWrapper from '@components/MarkdownWrapper';
import MainContainer from '@components/shared/layout/MainContainer';
import Slice from '@components/Slice';
import { getArticle } from '@data/contents';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .markdown-actu {
    img {
      max-width: 100%;
    }
  }
`;

const Article = () => {
  const router = useRouter();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!router.query.slug) {
      return;
    }

    const article = getArticle(router.query.slug as string);
    if (article) {
      setContent(article.content);
    } else {
      router.push('/actus');
    }
  }, [router]);

  return (
    <MainContainer currentMenu="/actus">
      <GlobalStyle />
      <Slice padding={8}>
        <MarkdownWrapper value={content} className="markdown-actu" />
      </Slice>
    </MainContainer>
  );
};

export default Article;
