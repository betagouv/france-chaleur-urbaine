import type { PrerequisiteStatus } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import cx from '@/utils/cx';

export function PrerequisiteStatusBadge({ status }: { status: PrerequisiteStatus }) {
  const config = {
    aVerifier: {
      className: 'bg-[#FEECC2] text-[#716043]',
      label: 'À VÉRIFIER',
    },
    contraignant: {
      className: 'bg-[#FFE9E6] text-error',
      label: 'CONTRAIGNANT',
    },
    defavorable: {
      className: 'bg-[#FFE9E6] text-error',
      label: 'DÉFAVORABLE',
    },
    favorable: {
      className: 'bg-[#B8FEC9] text-success',
      label: 'FAVORABLE',
    },
  } satisfies Record<PrerequisiteStatus, { className: string; label: string }>;

  return <span className={cx('w-fit rounded-sm px-2 py-1 text-sm font-bold', config[status].className)}>{config[status].label}</span>;
}
