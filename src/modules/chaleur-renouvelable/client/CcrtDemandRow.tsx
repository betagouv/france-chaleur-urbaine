import Badge from '@codegouvfr/react-dsfr/Badge';
import { Fragment } from 'react';

import Button from '@/components/ui/Button';
import type { CcrtTrackingPlacement } from '@/modules/analytics/posthog.config';
import cx from '@/utils/cx';
import { dayjs } from '@/utils/date';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } from '../constants';
import type { CcrtDemand, CcrtDemandUpdate } from '../types';
import { CcrtAdminDemandAssignment } from './CcrtAdminDemandAssignment';
import { CcrtDemandDetails } from './CcrtDemandDetails';
import { CcrtDemandValidation } from './CcrtDemandValidation';
import { CcrtHeatingEnergyTag } from './CcrtHeatingEnergyTag';
import { getCcrtDemandTab } from './ccrt-workspace';

type CcrtDemandRowProps = {
  demand: CcrtDemand;
  isExpanded: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  onContact: (contactType: 'email' | 'phone') => void;
  onSimulation: (placement?: CcrtTrackingPlacement) => void;
  onMap: () => void;
  onManageAccess: () => void;
  onSendEmail: (showHistory?: boolean, placement?: CcrtTrackingPlacement) => void;
  onUpdate: (values: CcrtDemandUpdate) => Promise<void>;
  onValidate?: (demandId: string) => Promise<void>;
};

/**
 * Compact demand summary with an accessible expandable building sheet.
 */
export function CcrtDemandRow({
  demand,
  isExpanded,
  isUpdating,
  onToggle,
  onContact,
  onSimulation,
  onUpdate,
  onSendEmail,
  onValidate,
  onMap,
  onManageAccess,
}: CcrtDemandRowProps) {
  const isToProcess = demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS;
  const fullName = `${demand.first_name} ${demand.last_name}`;

  return (
    <Fragment>
      <tr
        className={cx(
          'h-[124px]',
          isExpanded &&
            'bg-(--background-alt-blue-france)! [&_td:first-child]:border-l-4 [&_td:first-child]:border-(--border-active-blue-france)'
        )}
      >
        <td className="w-12 px-2!">
          <Button
            priority="tertiary no outline"
            size="small"
            iconId={isExpanded ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
            title={`${isExpanded ? 'Replier' : 'Déplier'} la demande de ${fullName}`}
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? `ccrt-demand-${demand.id}` : undefined}
            onClick={onToggle}
          />
        </td>
        <td>
          <div className="flex flex-col leading-6">
            <button
              type="button"
              className="self-start text-left font-bold text-(--text-action-high-blue-france)"
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? `ccrt-demand-${demand.id}` : undefined}
              onClick={onToggle}
            >
              {fullName}
            </button>
            <span className="-mr-2 text-sm leading-6">{demand.occupant_status}</span>
            {demand.phone && (
              <a
                className="self-start bg-none text-sm leading-6 text-(--text-action-high-blue-france) no-underline shadow-none"
                href={`tel:${demand.phone}`}
                onClick={() => onContact('phone')}
              >
                {demand.phone}
              </a>
            )}
            <a
              className="self-start text-sm leading-6 text-(--text-action-high-blue-france)"
              href={`mailto:${demand.email}`}
              onClick={() => onContact('email')}
            >
              {demand.email}
            </a>
          </div>
        </td>
        <td className="align-top!">
          <p className="-mr-2 mb-1 font-medium">{demand.address}</p>
          <p className="mb-1 text-sm leading-6">{demand.housing_count} logements</p>
          <div className="flex flex-wrap items-center gap-2 text-sm leading-6">
            <CcrtHeatingEnergyTag heating_energy={demand.heating_energy} housing_type={demand.housing_type} />
            {demand.annual_heating_consumption !== null && <span>{demand.annual_heating_consumption} MWh/an</span>}
          </div>
        </td>
        <td className="align-top!">
          {demand.alternative_heating_solutions.length === 0 && <p className="mb-1 text-sm leading-6">Aucune solution enregistrée</p>}
          <ol className="m-0 mb-1 list-none p-0">
            {demand.alternative_heating_solutions.slice(0, 3).map((solution, index) => (
              <li key={solution} className="flex items-center gap-1 p-0 leading-6">
                <span
                  className={cx(
                    'flex size-5 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    index === 0
                      ? 'bg-(--background-action-high-blue-france) text-(--text-inverted-blue-france)'
                      : 'bg-(--background-alt-blue-france) text-(--artwork-minor-blue-france)'
                  )}
                >
                  {index + 1}
                </span>
                <span className="font-medium">{solution}</span>
              </li>
            ))}
          </ol>
          <a
            className="fr-link fr-link--sm fr-link--icon-right fr-icon-external-link-line"
            href={demand.simulation_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSimulation('liste')}
          >
            Voir la simulation
          </a>
        </td>
        <td>
          <time className="text-sm leading-6" dateTime={demand.created_at}>
            {dayjs(demand.created_at).format('D MMM YYYY')}
          </time>
        </td>
        <td>
          <Badge
            severity={isToProcess || getCcrtDemandTab(demand) === 'closed' ? 'warning' : 'info'}
            noIcon={!isToProcess}
            className={isToProcess ? 'max-w-none! whitespace-nowrap! break-normal! before:shrink-0' : 'whitespace-normal!'}
          >
            {isToProcess ? <span className="whitespace-nowrap">À traiter</span> : demand.status}
          </Badge>
          {isToProcess && (
            <p className="mb-0 mt-1 text-sm leading-6 text-(--text-default-warning)">
              Depuis {Math.max(0, dayjs().diff(demand.created_at, 'day'))} j
            </p>
          )}
        </td>
        <td className="text-right!">
          {onValidate && !demand.validated ? (
            <CcrtDemandValidation demandId={demand.id} onValidate={onValidate} />
          ) : (
            <Button
              size="large"
              priority={isToProcess ? 'primary' : 'secondary'}
              iconId="fr-icon-mail-line"
              iconPosition="right"
              onClick={() => onSendEmail()}
            >
              {isToProcess ? 'Contacter' : 'Relancer'}
            </Button>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-l-4 border-(--border-active-blue-france) bg-(--background-alt-blue-france)!">
          <td colSpan={7} className="p-0!">
            <CcrtDemandDetails
              demand={demand}
              isUpdating={isUpdating}
              onUpdate={onUpdate}
              onContact={(showHistory) => onSendEmail(showHistory, 'fiche')}
              onSimulation={() => onSimulation('fiche')}
              onMap={onMap}
              onManageAccess={onManageAccess}
              onCollapse={onToggle}
              adminControls={onValidate && <CcrtAdminDemandAssignment demand={demand} />}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
