import cx from '@/utils/cx';

import type { DemandTrackingPlacement } from '../constants';
import { DemandTrackingForm } from './DemandTrackingForm';

type DemandTrackingCardProps = {
  placement: DemandTrackingPlacement;
  className?: string;
};

/**
 * "Vous avez déjà déposé une demande ?" white card: pitch + the email tracking form.
 * Shared by the home page tools section and the hero of /suivre-ma-demande.
 */
export function DemandTrackingCard({ placement, className }: DemandTrackingCardProps) {
  return (
    <div className={cx('grid gap-4 border border-(--border-default-grey) bg-white p-4 md:grid-cols-2 md:gap-8 md:p-5', className)}>
      <div>
        <h2 className="fr-h6 mb-2 text-(--text-title-blue-france)">Vous avez déjà déposé une demande ?</h2>
        <p className="mb-0 text-sm">Recevez par email l'état d'avancement de votre demande, sans créer de compte.</p>
      </div>
      <DemandTrackingForm placement={placement} />
    </div>
  );
}
