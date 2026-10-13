import type { ReactNode } from 'react';

import Notice from '@/components/ui/Notice';
import type { RouterOutput } from '@/modules/trpc/client';

type MergeCandidate = RouterOutput['reseaux']['mergePreview']['candidates'][number];

type MergeNetworkImpactsProps = {
  absorbed: MergeCandidate[];
  keptLabel: string;
};

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count > 1 ? pluralForm : singular}`;

/**
 * Everything the merge repoints from each absorbed network to the kept one (demands, permissions, documents…), so the
 * admin sees the consequences before confirming: an absorbed network is deleted afterwards.
 */
function MergeNetworkImpacts({ absorbed, keptLabel }: MergeNetworkImpactsProps) {
  return (
    <Notice variant="warning" size="sm">
      <div className="flex flex-col gap-2">
        <span>
          Les réseaux absorbés seront supprimés, leurs tracés réunis avec celui de «&nbsp;{keptLabel}&nbsp;», et tout ce qui les visait
          repointé&nbsp;:
        </span>
        {absorbed.map((network) => {
          const impacts = network.impacts;
          const lines: { key: string; content: ReactNode }[] = [
            ...(impacts.demands > 0
              ? [{ content: plural(impacts.demands, 'demande de raccordement', 'demandes de raccordement'), key: 'demands' }]
              : []),
            ...(impacts.permissions.length > 0
              ? [
                  {
                    content: (
                      <>
                        {plural(impacts.permissions.length, 'permission de compte transférée', 'permissions de compte transférées')}
                        <ul className="mb-0 list-disc pl-6">
                          {impacts.permissions.map((email) => (
                            <li key={email}>{email}</li>
                          ))}
                        </ul>
                      </>
                    ),
                    key: 'permissions',
                  },
                ]
              : []),
            ...(impacts.change_requests > 0
              ? [
                  {
                    content: plural(impacts.change_requests, 'demande de modification', 'demandes de modification'),
                    key: 'change_requests',
                  },
                ]
              : []),
            ...(impacts.documents > 0
              ? [{ content: plural(impacts.documents, 'document publié', 'documents publiés'), key: 'documents' }]
              : []),
            ...(impacts.reminders > 0 ? [{ content: plural(impacts.reminders, 'rappel', 'rappels'), key: 'reminders' }] : []),
            ...(impacts.extensions > 0
              ? [{ content: plural(impacts.extensions, 'extension rattachée', 'extensions rattachées'), key: 'extensions' }]
              : []),
            ...(impacts.pdps > 0
              ? [
                  {
                    content: plural(
                      impacts.pdps,
                      'périmètre de développement prioritaire lié',
                      'périmètres de développement prioritaire liés'
                    ),
                    key: 'pdps',
                  },
                ]
              : []),
            ...(network.values.organization
              ? [
                  {
                    content: (
                      <>
                        rattachement à l'organisation «&nbsp;{network.values.organization}&nbsp;» supprimé avec le réseau&nbsp;: le réseau
                        conservé garde son propre rattachement (ou celui choisi ci-dessus)&nbsp;; sinon, le recréer dans Gestion des
                        organisations
                      </>
                    ),
                    key: 'organization',
                  },
                ]
              : []),
          ];
          return (
            <div key={network.id_fcu}>
              <strong>{network.nom_reseau ?? `Réseau #${network.id_fcu}`}</strong>
              {network.identifiant_reseau ? ` (${network.identifiant_reseau})` : ''}
              {!network.has_geometry && ' — sans tracé'}
              {lines.length > 0 ? (
                <ul className="mb-0 list-disc pl-6">
                  {lines.map((line) => (
                    <li key={line.key}>{line.content}</li>
                  ))}
                </ul>
              ) : (
                <span>&nbsp;: rien ne le vise</span>
              )}
            </div>
          );
        })}
      </div>
    </Notice>
  );
}

export default MergeNetworkImpacts;
