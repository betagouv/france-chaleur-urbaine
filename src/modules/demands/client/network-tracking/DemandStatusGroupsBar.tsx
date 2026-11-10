import { type DemandStatusGroup, demandStatusGroupLabels } from '@/modules/demands/constants';
import cx from '@/utils/cx';

const groups = [
  { colorClassName: 'bg-(--error-425-625)', key: 'pending' },
  { colorClassName: 'bg-(--blue-france-main-525)', key: 'inProgress' },
  { colorClassName: 'bg-(--grey-625-425)', key: 'closed' },
] as const satisfies readonly { key: DemandStatusGroup; colorClassName: string }[];

type DemandStatusGroupsBarProps = Record<DemandStatusGroup, number> & {
  className?: string;
};

/**
 * Stacked bar of the demands of a network by status group (pending, in progress, closed), with the counts spelled out below.
 */
export function DemandStatusGroupsBar({ className, ...counts }: DemandStatusGroupsBarProps) {
  const filledGroups = groups.filter((group) => counts[group.key] > 0);
  return (
    <div className={cx('flex w-full flex-col gap-1', className)}>
      <div className="flex h-2 w-full gap-0.5" aria-hidden>
        {filledGroups.map((group) => (
          <div key={group.key} className={cx('min-w-1 basis-0 rounded-xs', group.colorClassName)} style={{ flexGrow: counts[group.key] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2 text-xs">
        {filledGroups.map((group) => (
          <span key={group.key} className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className={cx('inline-block size-2 rounded-full', group.colorClassName)} aria-hidden />
            {counts[group.key]} {demandStatusGroupLabels[group.key].toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
