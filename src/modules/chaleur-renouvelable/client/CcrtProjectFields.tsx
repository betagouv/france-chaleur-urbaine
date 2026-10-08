import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import trpc from '@/modules/trpc/client';

import type { CcrtDemand } from '../types';
import { CcrtDetailsSection } from './CcrtDetailsSection';

type CcrtProjectFieldsProps = { demand: CcrtDemand; onSimulation?: () => void };

/**
 * Displays the user's original project stages and comment alongside the saved simulation.
 */
export function CcrtProjectFields({ demand, onSimulation }: CcrtProjectFieldsProps) {
  const eligibilityQuery = trpc.batEnr.ccrt.getHeatNetworkEligibility.useQuery({ demandId: demand.id });
  const eligibility = eligibilityQuery.data;
  return (
    <CcrtDetailsSection title="Avancement déclaré par l’usager">
      {demand.project_status.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {demand.project_status.map((status) => (
            <Tag key={status} className="bg-(--background-contrast-blue-france)! font-normal text-(--text-action-high-blue-france)!">
              {status}
            </Tag>
          ))}
        </div>
      )}
      <p className="mb-1 text-sm leading-6 text-(--text-default-grey)">Commentaire laissé dans le formulaire</p>
      {demand.comments ? (
        <blockquote className="m-0 mb-6 whitespace-pre-wrap break-words text-base leading-6 text-(--text-default-grey)">
          « {demand.comments} »
        </blockquote>
      ) : (
        <p className="mb-6 text-base leading-6 text-(--text-default-grey)">Non renseigné</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-(--background-alt-blue-france) p-4">
        <div>
          <h4 className="mb-1 text-lg">Simulation de l’usager</h4>
          <p className="mb-0 text-sm leading-6" aria-live="polite">
            {eligibilityQuery.isPending
              ? 'Vérification de l’éligibilité au réseau de chaleur…'
              : eligibility
                ? `${eligibility.isEligible ? 'Éligible' : 'Non éligible'}${eligibility.distance === null ? '' : ` · ${Math.round(eligibility.distance)} m`}`
                : 'Éligibilité au réseau de chaleur indisponible'}
          </p>
        </div>
        <Button
          priority="secondary"
          iconId="fr-icon-arrow-right-up-line"
          iconPosition="right"
          linkProps={{ href: demand.simulation_url, onClick: onSimulation, rel: 'noopener noreferrer', target: '_blank' }}
        >
          Ouvrir la simulation
        </Button>
      </div>
    </CcrtDetailsSection>
  );
}
