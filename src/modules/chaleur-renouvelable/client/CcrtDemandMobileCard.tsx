import Badge from '@codegouvfr/react-dsfr/Badge';

import Button from '@/components/ui/Button';
import { dayjs } from '@/utils/date';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } from '../constants';
import type { CcrtDemand } from '../types';
import { CcrtDemandValidation } from './CcrtDemandValidation';

type CcrtDemandMobileCardProps = {
  demand: CcrtDemand;
  onOpen: () => void;
  onContact: () => void;
  onValidate?: (demandId: string) => Promise<void>;
};

/**
 * Mobile demand summary matching the CCRT card layout.
 */
export function CcrtDemandMobileCard({ demand, onOpen, onContact, onValidate }: CcrtDemandMobileCardProps) {
  const isToProcess = demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS;
  const fullName = `${demand.first_name} ${demand.last_name}`;
  return (
    <article className="space-y-2 border border-(--background-default-grey-active) bg-(--background-default-grey) p-4">
      <div className="flex items-start justify-between gap-2">
        <Badge severity={isToProcess ? 'warning' : 'info'} noIcon={!isToProcess}>
          {isToProcess ? 'À traiter' : demand.status}
        </Badge>
        {isToProcess && (
          <span className="shrink-0 text-sm text-(--text-default-warning)">
            Depuis {Math.max(0, dayjs().diff(demand.created_at, 'day'))}j
          </span>
        )}
      </div>
      <h2 className="mb-0 text-base leading-6">
        <button type="button" className="text-left text-(--text-action-high-blue-france)" onClick={onOpen}>
          {fullName}
        </button>
      </h2>
      <p className="mb-0 break-words font-medium leading-6">{demand.address}</p>
      <p className="mb-0 text-sm leading-6">
        {demand.alternative_heating_solutions[0] ? `Reco n°1 : ${demand.alternative_heating_solutions[0]}` : 'Aucune solution enregistrée'}
      </p>
      <div className="flex items-stretch gap-2">
        {onValidate && !demand.validated ? (
          <CcrtDemandValidation demandId={demand.id} full onValidate={onValidate} />
        ) : (
          <Button full iconId="fr-icon-mail-line" iconPosition="right" onClick={onContact}>
            Contacter par email
          </Button>
        )}
        <Button priority="secondary" iconId="fr-icon-add-line" title={`Ouvrir la demande de ${fullName}`} onClick={onOpen} />
      </div>
    </article>
  );
}
