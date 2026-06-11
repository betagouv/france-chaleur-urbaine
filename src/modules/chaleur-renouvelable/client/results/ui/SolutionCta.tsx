import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { ModeDeChauffageEnriched } from '@/modules/chaleur-renouvelable/client/modesChauffageData';

type SolutionCtaProps = {
  item: ModeDeChauffageEnriched;
  className?: string;
};

export function SolutionCta({ item, className }: SolutionCtaProps) {
  return (
    <Button
      href="#help-ademe"
      onClick={() => {
        trackPostHogEvent('fcr_results:recommended_solution_cta_clicked', { solution_type: item.label });
      }}
      iconId="fr-icon-arrow-right-line"
      iconPosition="right"
      className={className}
    >
      Passer à l’étape suivante
    </Button>
  );
}
