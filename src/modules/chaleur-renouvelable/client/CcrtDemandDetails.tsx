import Button from '@/components/ui/Button';

import type { CcrtDemand } from '../types';
import { CcrtBuildingForm } from './CcrtBuildingForm';
import { CcrtDemandFollowUp } from './CcrtDemandFollowUp';

type CcrtDemandDetailsProps = {
  demand: CcrtDemand;
  isUpdating: boolean;
  onUpdate: React.ComponentProps<typeof CcrtDemandFollowUp>['onUpdate'];
  onContact: (showHistory?: boolean) => void;
  onSimulation: () => void;
  onCollapse: () => void;
  onMap?: () => void;
  onManageAccess?: () => void;
};

/**
 * Building information and CCRT follow-up displayed below the selected demand.
 */
export function CcrtDemandDetails({
  demand,
  isUpdating,
  onUpdate,
  onContact,
  onSimulation,
  onCollapse,
  onMap,
  onManageAccess,
}: CcrtDemandDetailsProps) {
  return (
    <div id={`ccrt-demand-${demand.id}`} className="p-5 text-base">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <CcrtBuildingForm demand={demand} onSimulation={onSimulation} onMap={onMap} />
        <div>
          <CcrtDemandFollowUp
            demand={demand}
            isUpdating={isUpdating}
            onUpdate={onUpdate}
            onContact={onContact}
            onManageAccess={onManageAccess}
          />
        </div>
      </div>
      <Button priority="tertiary no outline" size="small" iconId="fr-icon-arrow-up-line" className="mt-4" onClick={onCollapse}>
        Replier la demande
      </Button>
    </div>
  );
}
