import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { ModeDeChauffageEnriched } from '@/modules/chaleur-renouvelable/client/modesChauffageData';

type SolutionCtaProps = {
  item: ModeDeChauffageEnriched;
  onHelpButtonClick?: () => void;
  className?: string;
};

export function SolutionCta({ item, onHelpButtonClick, className }: SolutionCtaProps) {
  return (
    <Button
      href={onHelpButtonClick ? undefined : '#help-ademe'}
      onClick={() => {
        trackPostHogEvent('fcr_results:recommended_solution_cta_clicked', { solution_type: item.label });
        onHelpButtonClick?.();
      }}
      iconId="fr-icon-arrow-right-line"
      iconPosition="right"
      className={className}
    >
      Passer à l’étape suivante
    </Button>
  );
}
