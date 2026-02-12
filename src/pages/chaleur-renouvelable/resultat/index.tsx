import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useState } from 'react';

import AdemeHelp from '@/components/ChaleurRenouvelable/AdemeHelp';
import ChoixChauffageResults from '@/components/choix-chauffage/ChoixChauffageResults';
import Share from '@/components/Share';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Modal from '@/components/ui/Modal';

export default function ChaleurRenouvelableResultatPage() {
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
    >
      <div className="fr-container fr-pt-6w">
        <div className="flex justify-between fr-mb-3w">
          <Button priority="secondary" iconId="fr-icon-arrow-left-line" onClick={() => console.log('retour')}>
            Retour
          </Button>
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
        <CallOut iconId="fr-icon-lightbulb-line" title="Comment sont calculés ces résultats ?" size="lg" colorVariant="blue-ecume">
          <p className="fr-callout__text">
            Nos recommandations sont calculées à partir des informations que vous avez fournies : mode de chauffage, surface moyenne, classe
            DPE, disponibilité d’espaces extérieurs… Ces critères permettent de classer les solutions par pertinence et d’estimer les coûts
            et contraintes techniques propres à votre situation.
          </p>
          <div className="mt-2">
            <a className="fr-link" href="#">
              En savoir plus
            </a>
          </div>
        </CallOut>
        <h3>Et maintenant ?</h3>
        <AdemeHelp />
        <div className="fr-my-6w flex justify-center">
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
