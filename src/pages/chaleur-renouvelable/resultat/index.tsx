import { createModal } from '@codegouvfr/react-dsfr/Modal';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import Share from '@/components/Share';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Modal from '@/components/ui/Modal';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';
import { useSimulationStartRoute } from '@/modules/simulation-tracking/client/useSimulationTracking';

const ChoixChauffageResults = dynamic(() => import('@/modules/chaleur-renouvelable/client/ChoixChauffageResults'), {
  //loading: () => <Placeholder advancedMode={false} />,
  // Publicode engine takes 2s to load and is unnecessary on the server side
  ssr: false,
});

const shareModal = createModal({
  id: 'share-modal',
  isOpenedByDefault: false,
});

export default function ChaleurRenouvelableResultatPage() {
  useTrackPageView();
  // Back to the form the visitor came from, in the right mode; the address will be typed again anyway.
  const startRoute = useSimulationStartRoute();
  const backHref = startRoute === '/' ? '/?mode=comparateur' : '/chaleur-renouvelable';
  const [openShareModal, setOpenShareModal] = useState(false);
  return (
    <SimplePage
      title="Découvrez le chauffage qui vous convient !"
      currentPage="/chaleur-renouvelable"
      description="Découvrez les modes de chauffage renouvelables adaptés à votre logement"
      className="fr-py-6w bg-[#FFFCF9]"
    >
      <div className="fr-container">
        <div className="flex justify-between fr-mb-3w">
          <Link variant="secondary" href={backHref}>
            <span className="fr-icon-arrow-left-line fr-mr-1w" /> Retour
          </Link>
          <Button
            priority="secondary"
            iconId="fr-icon-share-forward-line"
            iconPosition="right"
            onClick={() => {
              trackPostHogEvent('fcr_results:share_button_clicked');
              setOpenShareModal(true);
            }}
          >
            Partager
          </Button>

          <Modal modal={shareModal} title="" open={openShareModal} onClose={() => setOpenShareModal(false)}>
            <Share />
          </Modal>
        </div>
        <h2>Résultats : Vos solutions de chauffage écologique</h2>
        <ChoixChauffageResults />
      </div>
    </SimplePage>
  );
}
