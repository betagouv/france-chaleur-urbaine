import { type DemandStatusGroup, demandStatusGroupLabels, demandStatusGroupOrder } from '@/modules/demands/constants';
import cx from '@/utils/cx';

const groupColorClassNames = {
  closed: 'bg-(--grey-625-425)',
  inProgress: 'bg-(--blue-france-main-525)',
  pending: 'bg-(--error-425-625)',
} as const satisfies Record<DemandStatusGroup, string>;

type DemandStatusGroupsBarProps = Record<DemandStatusGroup, number> & {
  className?: string;
};

/**
 * Stacked bar of the demands of a network by status group (pending, in progress, closed), with the counts spelled out below.
 */
export function DemandStatusGroupsBar({ className, ...counts }: DemandStatusGroupsBarProps) {
  const filledGroups = demandStatusGroupOrder.filter((group) => counts[group] > 0);
  return (
    <div className={cx('flex w-full flex-col gap-1', className)}>
      <div className="flex h-2 w-full gap-0.5" aria-hidden>
        {filledGroups.map((group) => (
          <div key={group} className={cx('min-w-1 basis-0 rounded-xs', groupColorClassNames[group])} style={{ flexGrow: counts[group] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2 text-xs">
        {filledGroups.map((group) => (
          <span key={group} className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className={cx('inline-block size-2 rounded-full', groupColorClassNames[group])} aria-hidden />
            {counts[group]} {demandStatusGroupLabels[group].toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
