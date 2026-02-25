import { createModal } from '@codegouvfr/react-dsfr/Modal';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import Share from '@/components/Share';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Modal from '@/components/ui/Modal';

const ChoixChauffageResults = dynamic(() => import('@/components/choix-chauffage/ChoixChauffageResults'), {
  //loading: () => <Placeholder advancedMode={false} />,
  // Publicode engine takes 2s to load and is unnecessary on the server side
  ssr: false,
});

export default function ChaleurRenouvelableResultatPage() {
  const searchParams = useSearchParams();
  const [openShareModal, setOpenShareModal] = useState(false);
  const eligibilityTestModal = createModal({
    id: 'share-modal',
    isOpenedByDefault: false,
  });
  return (
    <SimplePage
      title="Découvrez le chauffage qui vous convient !"
      currentPage="/chaleur-renouvelable"
      description="Découvrez les modes de chauffage renouvelables adaptés à votre logement"
      className="bg-[#FFFCF9]"
    >
      <div className="fr-container fr-pt-6w">
        <div className="flex justify-between fr-mb-3w">
          <Link variant="secondary" href={`/chaleur-renouvelable${searchParams ? `?${searchParams.toString()}` : ''}`}>
            <span className="fr-icon-arrow-left-line fr-mr-1w" /> Retour
          </Link>
          <Button priority="secondary" iconId="fr-icon-share-forward-line" iconPosition="right" onClick={() => setOpenShareModal(true)}>
            Partager
          </Button>

          <Modal
            modal={eligibilityTestModal}
            title=""
            open={openShareModal}
            onClose={() => setOpenShareModal(false)}
            children={<Share />}
          />
        </div>
        <h2>Résultats : Vos solutions de chauffage écologique</h2>

        <ChoixChauffageResults />
        <div className="fr-py-6w flex justify-center">
          <Link
            title="Je donne mon avis - nouvelle fenêtre"
            isExternal
            className="after:content-none bg-none"
            href="https://jedonnemonavis.numerique.gouv.fr/Demarches/3977?button=4400"
          >
            <Image
              src="https://jedonnemonavis.numerique.gouv.fr/static/bouton-bleu-clair.svg"
              alt="Je donne mon avis"
              width="200"
              height="85"
            />
          </Link>
        </div>
      </div>
    </SimplePage>
  );
}
