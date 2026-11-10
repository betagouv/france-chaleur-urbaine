import type { ReactNode } from 'react';

import Link from '@/components/ui/Link';

type SolutionContentLinkProps = {
  href: string;
  children: ReactNode;
};

/**
 * Preserves article link styling and routes first-party URLs through Next.js.
 */
export function SolutionContentLink({ href, children }: SolutionContentLinkProps) {
  const target = href.replace('https://france-chaleur-urbaine.beta.gouv.fr', '');
  return (
    <Link href={target} variant="link" isExternal={target.startsWith('http')} className="wrap-anywhere">
      {children}
    </Link>
  );
}
