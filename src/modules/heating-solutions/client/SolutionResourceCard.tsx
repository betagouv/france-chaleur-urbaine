import type { ReactNode } from 'react';

import Link from '@/components/ui/Link';

import { SolutionPictogram } from './SolutionPictogram';

type SolutionResourceCardProps = {
  title: string;
  icon: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  isPrimary?: boolean;
};

/**
 * Groups further-reading content and its action in a template resource card.
 */
export function SolutionResourceCard({ title, icon, children, actionHref, actionLabel, isPrimary }: SolutionResourceCardProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-[#f3f6fe] px-4 py-7">
      <h3 className="mb-4 flex items-center gap-2 font-bold">
        <SolutionPictogram icon={icon} />
        {title}
      </h3>
      <div className="grow [&>p:last-child]:mb-0">{children}</div>
      {actionHref && (
        <Link
          href={actionHref}
          variant={isPrimary ? 'primary' : 'secondary'}
          isExternal={actionHref.startsWith('http')}
          className="fr-btn--icon-right fr-icon-arrow-right-line mt-4 max-w-full self-start"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
