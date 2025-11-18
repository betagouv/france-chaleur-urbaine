import { type ReactNode, useState } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import { eligibilityTypes } from '@/modules/pro-eligibility-tests/constants';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import cx from '@/utils/cx';

type EligibilityHelpDialogProps = {
  children?: ReactNode;
  detailedEligibilityStatus?: ProEligibilityTestHistoryEntry['eligibility'];
  tags?: string[];
};

const EligibilityHelpDialog = ({ children, detailedEligibilityStatus, tags }: EligibilityHelpDialogProps) => {
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
            {eligibilityTypes.map((eligibilityCase) => {
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
                          {/* <div>
                            <span className="font-medium">Communes du réseau :</span>{' '}
                            {detailedEligibilityStatus.communes?.join(', ') || '—'}
                          </div> */}
                          <div>
                            <span className="font-medium">Distance au réseau le plus proche :</span>{' '}
                            {detailedEligibilityStatus.distance != null ? `${detailedEligibilityStatus.distance} m` : '—'}
                          </div>
                          <div>
                            <span className="font-medium">Tags gestionnaires potentiels :</span> {tags?.length ? tags?.join(', ') : '—'}
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
