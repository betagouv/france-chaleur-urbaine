import dynamic from 'next/dynamic';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import cx from '@/utils/cx';

import type { AccessCounts } from '../types';

const AccessDetailDialog = dynamic(() => import('./AccessDetailDialog'), { ssr: false });

type AccessCountsCellProps = {
  demandId: string;
  accessCounts: AccessCounts;
};

const roleBadgeBase = 'inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold';

/**
 * Cellule compacte affichant les compteurs d'utilisateurs ayant (ou qui auront) accès à la demande,
 * groupés par rôle. Warning explicite si personne n'a accès (demande orpheline).
 * Clic → dialog dynamique avec le détail (nom/email/structure), chargé au premier clic uniquement.
 */
export default function AccessCountsCell({ demandId, accessCounts }: AccessCountsCellProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const total = accessCounts.gestionnaire + accessCounts.collectivite + accessCounts.alec + accessCounts.ccrt;

  const handleOpen = () => {
    setHasOpened(true);
    setOpen(true);
  };

  if (total === 0) {
    return (
      <Tooltip title="Aucun utilisateur n'a accès à cette demande. Il manque un gestionnaire, une collectivité, une ALEC ou un CCRT avec les permissions adéquates.">
        <span className="flex items-center gap-1 text-destructive text-xs">
          <Icon name="fr-icon-alert-line" size="sm" />
          Aucun accès
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip
        title={
          <div className="flex flex-col gap-0.5 text-left">
            <div className="italic text-xs mt-1">Cliquer pour voir le détail</div>
          </div>
        }
      >
        <Button
          priority="tertiary no outline"
          size="small"
          stopPropagation
          onClick={handleOpen}
          title="Voir le détail des utilisateurs"
          className="px-1!"
        >
          <span className="flex flex-col items-start gap-0.5">
            {accessCounts.gestionnaire > 0 && (
              <span className={cx(roleBadgeBase, 'bg-purple-700 text-white')}>Gestionnaire ({accessCounts.gestionnaire})</span>
            )}
            {accessCounts.collectivite > 0 && (
              <span className={cx(roleBadgeBase, 'bg-orange-600 text-white')}>Collectivité ({accessCounts.collectivite})</span>
            )}
            {accessCounts.alec > 0 && <span className={cx(roleBadgeBase, 'bg-teal-600 text-white')}>ALEC ({accessCounts.alec})</span>}
            {accessCounts.ccrt > 0 && <span className={cx(roleBadgeBase, 'bg-pink-600 text-white')}>CCRT ({accessCounts.ccrt})</span>}
          </span>
        </Button>
      </Tooltip>
      {hasOpened && <AccessDetailDialog demandId={demandId} open={open} onOpenChange={setOpen} />}
    </>
  );
}
