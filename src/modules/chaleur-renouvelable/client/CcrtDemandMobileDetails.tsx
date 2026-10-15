import Badge from '@codegouvfr/react-dsfr/Badge';

import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } from '../constants';
import type { CcrtDemand } from '../types';
import { CcrtAdminDemandAssignment } from './CcrtAdminDemandAssignment';
import { CcrtBuildingForm } from './CcrtBuildingForm';
import { CcrtBuildingIdentification } from './CcrtBuildingIdentification';
import { CcrtDemandFollowUp } from './CcrtDemandFollowUp';
import { CcrtDemandValidation } from './CcrtDemandValidation';
import { CcrtProjectFields } from './CcrtProjectFields';
import { getCcrtDemandTab } from './ccrt-workspace';
import type { useCcrtDemandActions } from './hooks/useCcrtDemandActions';

type CcrtDemandMobileDetailsProps = {
  demand: CcrtDemand;
  actions: ReturnType<typeof useCcrtDemandActions>;
  onClose: () => void;
  onValidate?: (demandId: string) => Promise<void>;
};

/**
 * Mobile demand sheet with shared forms in accordions and persistent contact actions.
 */
export function CcrtDemandMobileDetails({ demand, actions, onClose, onValidate }: CcrtDemandMobileDetailsProps) {
  const isToProcess = demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS;
  const isClosed = getCcrtDemandTab(demand) === 'closed';
  const followUp = trpc.batEnr.ccrt.getFollowUp.useQuery({ demandId: demand.id, offset: 0 });
  const onContact = (showHistory = false) => actions.openEmail(demand, showHistory, 'fiche');
  return (
    <section className="min-w-0 space-y-4 pb-24" aria-label={`Demande de ${demand.first_name} ${demand.last_name}`}>
      <Button priority="tertiary no outline" size="small" iconId="fr-icon-arrow-left-line" onClick={onClose}>
        Retour aux demandes
      </Button>
      <header className="space-y-2">
        <Badge severity={isToProcess ? 'warning' : 'info'} noIcon={!isToProcess}>
          {isToProcess ? 'À traiter' : demand.status}
        </Badge>
        <h1 className="mb-0 text-[28px] leading-9">
          {demand.first_name} {demand.last_name}
        </h1>
        <p className="mb-0 break-words font-medium leading-6">
          {demand.occupant_status} · {demand.address}
        </p>
      </header>
      <div className="space-y-2 border border-(--background-default-grey-active) bg-(--background-default-grey) p-4">
        <p className="mb-0 font-bold text-(--text-action-high-blue-france)">{isClosed ? 'DEMANDE CLÔTURÉE' : 'PROCHAINE ÉTAPE'}</p>
        <p className="mb-0 text-lg font-bold leading-7">
          {isToProcess
            ? 'Prendre contact avec l’usager'
            : isClosed
              ? 'Consulter le suivi de la demande'
              : 'Poursuivre l’accompagnement de l’usager'}
        </p>
        {isToProcess && (
          <p className="mb-0 text-sm text-(--text-default-warning)">
            En attente depuis {Math.max(0, dayjs().diff(demand.created_at, 'day'))}j
          </p>
        )}
      </div>
      <div className="border border-(--background-default-grey-active) bg-(--background-default-grey) p-4 [&_.fr-accordion__btn]:py-2! [&_.fr-accordion__btn]:font-medium! [&_.fr-collapse]:max-w-full [&_.fr-collapse]:break-words">
        <p className="mb-2 text-sm">Recommandations de la simulation</p>
        {demand.alternative_heating_solutions.length > 0 ? (
          <ol className="m-0 mb-2 list-decimal space-y-2 pl-6 font-medium">
            {demand.alternative_heating_solutions.slice(0, 3).map((solution) => (
              <li key={solution}>{solution}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm">Aucune solution enregistrée</p>
        )}
        <Accordion label="Usager" simple lazy className="border-t border-(--border-default-grey)">
          <p className="mb-2">
            {demand.occupant_status}
            {demand.organization_name && ` · ${demand.organization_name}`}
          </p>
          <a
            href={`mailto:${demand.email}`}
            className="mb-2 block break-all"
            onClick={() => actions.trackContact(demand, 'email', 'fiche')}
          >
            {demand.email}
          </a>
          {demand.phone && (
            <a href={`tel:${demand.phone}`} className="mb-4 block" onClick={() => actions.trackContact(demand, 'phone', 'fiche')}>
              {demand.phone}
            </a>
          )}
          <CcrtBuildingIdentification demand={demand} onMap={() => actions.trackMap(demand)} />
        </Accordion>
        <Accordion label="Bâtiment et chauffage" simple lazy className="border-t border-(--border-default-grey)">
          <CcrtBuildingForm demand={demand} buildingOnly />
        </Accordion>
        <Accordion label="Projet déclaré" simple lazy className="border-t border-(--border-default-grey)">
          <CcrtProjectFields demand={demand} onSimulation={() => actions.trackSimulation(demand, 'fiche')} />
        </Accordion>
        <Accordion
          label={`Suivi de la demande${followUp.data ? ` (${followUp.data.total})` : ''}`}
          simple
          lazy
          className="border-t border-(--border-default-grey)"
        >
          {onValidate && <CcrtAdminDemandAssignment demand={demand} />}
          <CcrtDemandFollowUp
            demand={demand}
            isUpdating={actions.isUpdating}
            onUpdate={(values) => actions.updateDemand(demand, values)}
            onContact={onContact}
            onManageAccess={() => actions.trackAccess(demand)}
            showContactAction={false}
          />
        </Accordion>
      </div>
      {!actions.emailDemand && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-2 border-t border-(--border-default-grey) bg-(--background-alt-grey) px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {demand.phone && (
            <Button
              priority="secondary"
              linkProps={{ href: `tel:${demand.phone}`, onClick: () => actions.trackContact(demand, 'phone', 'fiche') }}
            >
              Appeler
            </Button>
          )}
          {onValidate && !demand.validated ? (
            <CcrtDemandValidation demandId={demand.id} full onValidate={onValidate} />
          ) : (
            <Button full iconId="fr-icon-mail-line" iconPosition="right" onClick={() => onContact()}>
              Contacter par email
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
