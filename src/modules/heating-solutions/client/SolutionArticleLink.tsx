import Link from '@/components/ui/Link';
import type { ModeDeChauffageId } from '@/modules/chaleur-renouvelable/constants';

import { getHeatingSolutionHref } from '../constants';

type SolutionArticleLinkProps = {
  modeId: ModeDeChauffageId;
  solutionName: string;
};

/**
 * Opens a matching validated solution article in a new tab without losing the simulation.
 */
export function SolutionArticleLink({ modeId, solutionName }: SolutionArticleLinkProps) {
  const href = getHeatingSolutionHref(modeId);
  return href ? (
    <Link href={href} openInNewTab isExternal className="mt-3 inline-block" title={`En savoir plus sur ${solutionName} (nouvel onglet)`}>
      En savoir plus
    </Link>
  ) : null;
}
