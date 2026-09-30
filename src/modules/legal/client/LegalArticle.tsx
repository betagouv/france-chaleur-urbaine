import type { MDXComponents } from 'mdx/types';
import type { ComponentType } from 'react';

import { tableClasses } from '@/modules/doc/client/inventories/table-classes';

export type LegalArticleProps = {
  content: ComponentType<{ components?: MDXComponents }>;
  /** Page-specific components exposed to the MDX (e.g. the cookie consent button). */
  components?: MDXComponents;
};

/**
 * Renders a legal page (privacy policy, legal notice) from its MDX content:
 * DSFR-like tables, external links opened in a new tab.
 */
export function LegalArticle({ content: Content, components }: LegalArticleProps) {
  return <Content components={{ ...mdxComponents, ...components }} />;
}

const isExternalHref = (href: string | undefined) => !!href && /^https?:\/\//.test(href);

const mdxComponents: MDXComponents = {
  a: ({ href, ...props }) =>
    isExternalHref(href) ? <a href={href} target="_blank" rel="noopener noreferrer" {...props} /> : <a href={href} {...props} />,
  table: (props) => (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table} {...props} />
    </div>
  ),
  td: (props) => <td className={tableClasses.cell} {...props} />,
  th: (props) => <th className={tableClasses.header} {...props} />,
};
