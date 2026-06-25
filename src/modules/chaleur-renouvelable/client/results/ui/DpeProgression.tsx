import type { DPE } from '@/modules/chaleur-renouvelable/constants';

import { DpeTag } from './DpeTag';

export function DpeProgression({ from, to }: { from: DPE; to: DPE }) {
  return (
    <div className="flex items-center gap-3">
      <DpeTag letter={from} />
      <span>→</span>
      <DpeTag letter={to} />
    </div>
  );
}
