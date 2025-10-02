import { type ReactNode, useState } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import type { DetailedEligibilityStatus, EligibilityType } from '@/server/services/addresseInformation';
import cx from '@/utils/cx';
import type { ExtractKeys } from '@/utils/typescript';

type EligibilityCase = {
  type: EligibilityType;
  title: string;
  description: string;
};

// Crée un type qui vérifie que le tableau contient tous les cas
const eligibilityCases = [
  {
    description: "L'adresse se trouve dans un Périmètre de Développement Prioritaire (PDP) où un réseau de chaleur est prévu.",
    title: 'Dans un PDP',
    type: 'dans_pdp',
  },
  {
    description: "Un réseau de chaleur existant se trouve à moins de 100m (60m sur Paris) de l'adresse.",
    title: 'Réseau existant très proche',
    type: 'reseau_existant_tres_proche',
  },
  {
    description: "Un réseau de chaleur en construction se trouve à moins de 100m (60m sur Paris) de l'adresse.",
    title: 'Réseau futur très proche',
    type: 'reseau_futur_tres_proche',
  },
  {
    description: "L'adresse se trouve dans une zone où un réseau de chaleur est en cours de construction.",
    title: 'Dans une zone de réseau futur',
    type: 'dans_zone_reseau_futur',
  },
  {
    description: "Un réseau de chaleur existant se trouve entre 100 et 200m (60 et 100m sur Paris) de l'adresse.",
    title: 'Réseau existant proche',
    type: 'reseau_existant_proche',
  },
  {
    description: "Un réseau de chaleur en construction se trouve entre 100 et 200m (60 et 100m sur Paris) de l'adresse.",
    title: 'Réseau futur proche',
    type: 'reseau_futur_proche',
  },
  {
    description:
      "Un réseau de chaleur existant se trouve entre 200 et 1000m de l'adresse. Les tags gestionnaires sont automatiquement ajoutés si la distance est inférieure à 500m.",
    title: 'Réseau existant éloigné',
    type: 'reseau_existant_loin',
  },
  {
    description:
      "Un réseau de chaleur en construction se trouve entre 200 et 1000m de l'adresse. Les tags gestionnaires sont automatiquement ajoutés si la distance est inférieure à 500m.",
    title: 'Réseau futur éloigné',
    type: 'reseau_futur_loin',
  },
  {
    description: "L'adresse se trouve dans une ville où un réseau de chaleur existe mais dont le tracé n'est pas disponible.",
    title: 'Dans une ville avec réseau existant sans tracé',
    type: 'dans_ville_reseau_existant_sans_trace',
  },
  {
    description: "Aucun réseau de chaleur (existant ou en construction) ne se trouve à moins de 1000m de l'adresse.",
    title: 'Trop éloigné',
    type: 'trop_eloigne',
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
  detailedEligibilityStatus?: DetailedEligibilityStatus;
};

const EligibilityHelpDialog = ({ children, detailedEligibilityStatus }: EligibilityHelpDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
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
            {eligibilityCases.map((eligibilityCase) => {
              const isCurrent = detailedEligibilityStatus && eligibilityCase.type === detailedEligibilityStatus.type;
              return (
                <div
                  key={eligibilityCase.type}
                  className={cx('border rounded-lg p-4', isCurrent ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-gray-50 border-gray-200')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={cx('font-semibold mb-1', isCurrent ? 'text-blue-900' : 'text-gray-900')}>{eligibilityCase.title}</h4>
                      <p className={cx('text-sm mb-2', isCurrent ? 'text-blue-800' : 'text-gray-700')}>{eligibilityCase.description}</p>
                      {isCurrent && detailedEligibilityStatus && (
                        <div className="mt-2 space-y-1">
                          <div>
                            <span className="font-medium">Communes du réseau :</span>{' '}
                            {detailedEligibilityStatus.communes?.join(', ') || '—'}
                          </div>
                          <div>
                            <span className="font-medium">Distance au réseau le plus proche :</span>{' '}
                            {detailedEligibilityStatus.distance != null ? `${detailedEligibilityStatus.distance} m` : '—'}
                          </div>
                          <div>
                            <span className="font-medium">Tags gestionnaires potentiels :</span>{' '}
                            {detailedEligibilityStatus.tags?.length ? detailedEligibilityStatus.tags.join(', ') : '—'}
                          </div>
                          <details className="mt-2">
                            <summary className="cursor-pointer font-medium">Voir les données brutes</summary>
                            <pre className="text-xs bg-gray-100 rounded-sm p-2 mt-2 overflow-x-auto">
                              {JSON.stringify(detailedEligibilityStatus, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                    <div
                      className={
                        'ml-4 text-xs font-mono px-2 py-1 rounded-sm ' +
                        (isCurrent ? 'bg-blue-200 text-blue-900 border border-blue-600' : 'bg-gray-200 text-gray-500')
                      }
                    >
                      {eligibilityCase.type}
                    </div>
                  </div>
                </div>
              );
            })}
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
