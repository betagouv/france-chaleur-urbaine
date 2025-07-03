import { type ReactNode, useState } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import { type EligibilityType } from '@/server/services/addresseInformation';
import { type ExtractKeys } from '@/utils/typescript';

type EligibilityCase = {
  type: EligibilityType;
  title: string;
  description: string;
};

// Crée un type qui vérifie que le tableau contient tous les cas
const eligibilityCases = [
  {
    type: 'dans_pdp',
    title: 'Dans un PDP',
    description: "L'adresse se trouve dans un Périmètre de Développement Prioritaire (PDP) où un réseau de chaleur est prévu.",
  },
  {
    type: 'reseau_existant_tres_proche',
    title: 'Réseau existant très proche',
    description: "Un réseau de chaleur existant se trouve à moins de 100m (60m sur Paris) de l'adresse.",
  },
  {
    type: 'reseau_futur_tres_proche',
    title: 'Réseau futur très proche',
    description: "Un réseau de chaleur en construction se trouve à moins de 100m (60m sur Paris) de l'adresse.",
  },
  {
    type: 'dans_zone_reseau_futur',
    title: 'Dans une zone de réseau futur',
    description: "L'adresse se trouve dans une zone où un réseau de chaleur est en cours de construction.",
  },
  {
    type: 'reseau_existant_proche',
    title: 'Réseau existant proche',
    description: "Un réseau de chaleur existant se trouve entre 100 et 200m (60 et 100m sur Paris) de l'adresse.",
  },
  {
    type: 'reseau_futur_proche',
    title: 'Réseau futur proche',
    description: "Un réseau de chaleur en construction se trouve entre 100 et 200m (60 et 100m sur Paris) de l'adresse.",
  },
  {
    type: 'reseau_existant_loin',
    title: 'Réseau existant éloigné',
    description:
      "Un réseau de chaleur existant se trouve entre 200 et 1000m de l'adresse. Les tags gestionnaires sont automatiquement ajoutés si la distance est inférieure à 500m.",
  },
  {
    type: 'reseau_futur_loin',
    title: 'Réseau futur éloigné',
    description:
      "Un réseau de chaleur en construction se trouve entre 200 et 1000m de l'adresse. Les tags gestionnaires sont automatiquement ajoutés si la distance est inférieure à 500m.",
  },
  {
    type: 'dans_ville_reseau_existant_sans_trace',
    title: 'Dans une ville avec réseau existant sans tracé',
    description: "L'adresse se trouve dans une ville où un réseau de chaleur existe mais dont le tracé n'est pas disponible.",
  },
  {
    type: 'trop_eloigne',
    title: 'Trop éloigné',
    description: "Aucun réseau de chaleur (existant ou en construction) ne se trouve à moins de 1000m de l'adresse.",
  },
] as const satisfies EligibilityCase[];

export const eligibilityTitleByType = eligibilityCases.reduce(
  (acc, eligibilityCase) => {
    acc[eligibilityCase.type] = eligibilityCase.title;
    return acc;
  },
  {} as Record<EligibilityType, string>
);

// ensure all cases are present
type Missing = Exclude<EligibilityType, ExtractKeys<typeof eligibilityCases, 'type'>>;
type AssertAllChoicesPresent = Missing extends never ? true : never;
const _check: AssertAllChoicesPresent = true;

type EligibilityHelpDialogProps = {
  children?: ReactNode;
};

const EligibilityHelpDialog = ({ children }: EligibilityHelpDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children || (
          <Button priority="secondary" size="small">
            <Icon name="fr-icon-question-line" className="mr-2" />
            Aide éligibilité
          </Button>
        )}
      </div>
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Types d'éligibilité aux réseaux de chaleur"
        description="Voici les différents cas d'éligibilité déterminés selon la distance et la disponibilité des réseaux de chaleur."
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {eligibilityCases.map((eligibilityCase) => (
              <div key={eligibilityCase.type} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{eligibilityCase.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{eligibilityCase.description}</p>
                  </div>
                  <div className="ml-4 text-xs text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded">{eligibilityCase.type}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">Note importante</h5>
            <p className="text-sm text-blue-800">
              Les distances d'éligibilité peuvent varier selon les territoires. Sur Paris, les seuils sont réduits (60m au lieu de 100m pour
              la très forte éligibilité, 100m au lieu de 200m pour l'éligibilité standard).
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default EligibilityHelpDialog;
