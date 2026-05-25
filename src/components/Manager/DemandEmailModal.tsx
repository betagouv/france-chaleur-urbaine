import { useCallback, useRef, useState } from 'react';

import DemandEmailForm from '@/components/Manager/DemandEmailForm';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import type { Demand } from '@/modules/demands/types';

type DemandEmailModalProps = {
  demand: Demand | null;
  onClose: () => void;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
};

/**
 * Modale d'envoi de courriel à un demandeur (espaces gestionnaire et admin).
 * Protège contre une fermeture accidentelle : dès que le contenu est modifié,
 * Échap / clic extérieur / croix déclenchent une confirmation avant de fermer.
 */
function DemandEmailModal({ demand, onClose, updateDemand }: DemandEmailModalProps) {
  const isDirtyRef = useRef(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Stocké dans une ref (pas une state) pour que la frappe dans le formulaire ne re-render pas la modale.
  const handleDirtyChange = useCallback((isDirty: boolean) => {
    isDirtyRef.current = isDirty;
  }, []);

  // Repose sur le mode contrôlé de Dialog : onOpenChange(false) ne ferme pas de lui-même,
  // c'est cette fonction qui décide (confirmation si saisie en cours, sinon fermeture).
  const handleOpenChange = (open: boolean) => {
    if (open) {
      return;
    }
    if (isDirtyRef.current) {
      setIsConfirmOpen(true);
      return;
    }
    onClose();
  };

  const handleConfirmClose = () => {
    setIsConfirmOpen(false);
    isDirtyRef.current = false;
    onClose();
  };

  return (
    <>
      <Dialog title={`Envoi d'un courriel à ${demand?.Mail}`} size="lg" open={!!demand} onOpenChange={handleOpenChange}>
        {demand && <DemandEmailForm currentDemand={demand} updateDemand={updateDemand} onDirtyChange={handleDirtyChange} />}
      </Dialog>
      <Dialog
        title="Voulez-vous vraiment fermer ce message ?"
        size="md"
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        hideCloseButton
      >
        <div className="flex flex-col gap-4">
          <p className="m-0">Votre saisie sera perdue.</p>
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={() => setIsConfirmOpen(false)}>
              Continuer à écrire
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Fermer et perdre la saisie
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default DemandEmailModal;
