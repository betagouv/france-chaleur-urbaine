import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { useMemo, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Accordion from '@/components/ui/Accordion';
import Alert from '@/components/ui/Alert';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import { MAX_ITEMS_PER_ISSUE } from '@/modules/data-diagnostic/constants';
import type { Issue, IssueItem, IssueSeverity } from '@/modules/data-diagnostic/types';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

const severityOrder: IssueSeverity[] = ['error', 'warning'];

const severityBadgeSeverity = {
  error: 'error',
  warning: 'warning',
} as const satisfies Record<IssueSeverity, 'error' | 'warning'>;

const severityFilterLabels = {
  error: 'Erreurs',
  warning: 'Avertissements',
} as const satisfies Record<IssueSeverity, string>;

type SeverityCounts = Record<IssueSeverity, number>;

const DataDiagnosticPage = () => {
  const { data, error, refetch, isFetching } = trpc.dataDiagnostic.run.useQuery();
  const [activeSeverities, setActiveSeverities] = useState<Set<IssueSeverity>>(new Set(severityOrder));

  const counts = useMemo<SeverityCounts>(() => {
    const initial: SeverityCounts = { error: 0, warning: 0 };
    if (!data) return initial;
    return data.issues.reduce((accumulator, issue) => {
      accumulator[issue.severity] += 1;
      return accumulator;
    }, initial);
  }, [data]);

  const filteredIssues = useMemo(
    () => (data ? data.issues.filter((issue) => activeSeverities.has(issue.severity)) : []),
    [data, activeSeverities]
  );

  const toggleSeverity = (severity: IssueSeverity) => {
    setActiveSeverities((previous) => {
      const next = new Set(previous);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  const totalIssues = counts.error + counts.warning;

  return (
    <SimplePage title="Diagnostic des données" mode="authenticated">
      <Box py="4w" className="fr-container">
        <header className="flex justify-between items-start gap-4 mb-4">
          <div>
            <Heading as="h1" color="blue-france">
              Diagnostic des données
            </Heading>
            <Text>Liste des incohérences détectées sur les utilisateurs, permissions et demandes.</Text>
            {data && (
              <Text size="sm" className="text-faded">
                Dernière analyse : {new Date(data.generatedAt).toLocaleString('fr-FR')}
              </Text>
            )}
          </div>
          <Button onClick={() => refetch()} disabled={isFetching} iconId="ri-refresh-line" priority="secondary">
            {isFetching ? 'Analyse…' : 'Actualiser'}
          </Button>
        </header>

        {error && (
          <Alert variant="error" title="Erreur lors du diagnostic">
            {error.message ?? "Une erreur inattendue s'est produite"}
          </Alert>
        )}

        {!data && !error && isFetching && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <Text>Analyse en cours…</Text>
            </div>
          </div>
        )}

        {data && totalIssues === 0 && (
          <Alert variant="success" title="Aucun problème détecté">
            Toutes les vérifications de qualité de données sont passées.
          </Alert>
        )}

        {data && totalIssues > 0 && (
          <>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              {severityOrder.map((severity) => {
                const count = counts[severity];
                const isActive = activeSeverities.has(severity);
                return (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => toggleSeverity(severity)}
                    className={cx(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors',
                      isActive
                        ? 'bg-(--background-action-high-blue-france) text-white border-transparent'
                        : 'bg-white text-(--text-default-grey) border-(--border-default-grey) hover:bg-(--background-default-grey-hover)'
                    )}
                    disabled={count === 0}
                  >
                    <span>{severityFilterLabels[severity]}</span>
                    <span
                      className={cx(
                        'inline-flex items-center justify-center min-w-5 px-1.5 rounded-full text-xs font-semibold',
                        isActive ? 'bg-white/20' : 'bg-(--background-alt-grey)'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              {filteredIssues.map((issue) => (
                <IssueAccordion key={issue.type} issue={issue} />
              ))}
              {filteredIssues.length === 0 && <Text className="text-faded italic">Aucune anomalie pour les sévérités sélectionnées.</Text>}
            </div>
          </>
        )}
      </Box>
    </SimplePage>
  );
};

type IssueAccordionProps = {
  issue: Issue;
};

const IssueAccordion = ({ issue }: IssueAccordionProps) => {
  const countLabel = issue.truncated ? `${MAX_ITEMS_PER_ISSUE}+` : `${issue.totalCount}`;

  const label = (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Badge severity={severityBadgeSeverity[issue.severity]} small noIcon>
        {countLabel}
      </Badge>
      <span className="font-medium truncate">{issue.title}</span>
    </div>
  );

  return (
    <Accordion bordered label={label} id={issue.type} lazy>
      <Text className="mb-3">{issue.description}</Text>
      {issue.truncated && (
        <Alert variant="info" size="sm" className="mb-3" title="Résultat tronqué">
          Plus de {MAX_ITEMS_PER_ISSUE} éléments concernés. Seuls les {MAX_ITEMS_PER_ISSUE} premiers sont affichés.
        </Alert>
      )}
      <ul className="list-none pl-0 m-0 flex flex-col">
        {issue.items.map((item, index) => (
          <li key={`${issue.type}-${index}`}>
            <IssueItemContent item={item} />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};

type IssueItemContentProps = {
  item: IssueItem;
};

const itemClassName = 'block py-1.5 px-2 -mx-2 rounded transition-colors';

const IssueItemContent = ({ item }: IssueItemContentProps) => {
  const content = (
    <>
      <div className="font-medium wrap-break-word">{item.label}</div>
      {item.context && <div className="text-sm text-faded wrap-break-word">{item.context}</div>}
    </>
  );

  return item.href ? (
    <Link href={item.href} className={cx(itemClassName, 'no-underline! text-current! bg-none! hover:bg-(--background-default-grey-hover)')}>
      {content}
    </Link>
  ) : (
    <div className={itemClassName}>{content}</div>
  );
};

export default DataDiagnosticPage;
