import { businessRules } from '@/modules/app/business-rules';

import type { ExistingCcrtDemand } from '../constants';

type ExistingCcrtDemandPanelProps = {
  demand: ExistingCcrtDemand;
};

/**
 * Confirms the original accompaniment request without displaying classic network tracking or claiming another email was sent.
 */
export function ExistingCcrtDemandPanel({ demand }: ExistingCcrtDemandPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="mb-0">
        Vous avez déjà déposé une demande d’accompagnement pour ce bâtiment avec cette adresse email au cours des{' '}
        {businessRules.demandDedupWindowDays.value} derniers jours.
      </p>
      <p className="mb-0">
        Cette nouvelle demande n’a pas été prise en compte. Votre demande initiale est conservée : inutile de la renvoyer.
      </p>
      <dl>
        <dt className="font-bold">Adresse</dt>
        <dd>{demand.address}</dd>
        <dt className="font-bold">Demande déposée le</dt>
        <dd>{new Date(demand.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
      </dl>
    </div>
  );
}
