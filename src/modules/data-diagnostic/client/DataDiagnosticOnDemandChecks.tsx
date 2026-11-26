import { useState } from 'react';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { diagnosticChecks } from '@/modules/data-diagnostic/constants';
import trpc from '@/modules/trpc/client';

import { DataDiagnosticIssueList } from './DataDiagnosticIssueList';

const onDemandCheckTitles = diagnosticChecks
  .filter((check) => check.onDemand)
  .map((check) => check.title)
  .join(', ');

/**
 * The on-demand checks (`onDemand` in `diagnosticChecks`): the comparisons between network traces and PDP perimeters,
 * too slow and too rarely a priority to run at every display. A button launches them, their anomalies then replace it.
 */
export function DataDiagnosticOnDemandChecks() {
  const [isRequested, setIsRequested] = useState(false);
  const { data: issues, error } = trpc.dataDiagnostic.run.useQuery({ onDemand: true }, { enabled: isRequested, staleTime: 0 });

  return !isRequested ? (
    <div>
      <Button priority="tertiary" size="small" title={onDemandCheckTitles} onClick={() => setIsRequested(true)}>
        Contrôler la géométrie des PDP
      </Button>
    </div>
  ) : error ? (
    <Alert variant="error" size="sm" title="Contrôle de la géométrie des PDP indisponible">
      {error.message}
    </Alert>
  ) : (
    <DataDiagnosticIssueList issues={issues} emptyMessage="Géométrie des PDP : aucune anomalie détectée." />
  );
}
