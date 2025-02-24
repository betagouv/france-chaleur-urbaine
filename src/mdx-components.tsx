import type { MDXComponents } from 'mdx/types';

import Link from '@/components/ui/Link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Do not use from react-dsfr as it wraps everything in a p which causes hydration error when a paragraph is in the Highlight
    blockquote: ({ children }: any) => <div className="fr-highlight">{children}</div>,
    a: ({ href, children }: any) => (
      <Link href={href} isExternal={href.startsWith('http')}>
        {children}
      </Link>
    ),
    li: ({ children }: any) => (
      <li
        className="mb-2 pl-6 list-none bg-[url('/img/ressources-list.svg')] bg-no-repeat bg-[left_2px]"
        style={{
          backgroundSize: '20px', // Could not find a way to add both bg-[left_2px] and this with tailwind custom config
        }}
      >
        {children}
      </li>
    ),
    ...components,
  };
}
