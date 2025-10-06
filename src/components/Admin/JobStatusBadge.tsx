import Badge from '@codegouvfr/react-dsfr/Badge';

import type { Jobs } from '@/server/db/kysely';

const jobStatusConfig = {
  error: {
    className: 'bg-destructive! text-white!',
    label: 'Erreur',
  },
  finished: {
    className: 'bg-success! text-white!',
    label: 'Terminée',
  },
  pending: {
    className: 'bg-gray-500! text-white!',
    label: 'En attente',
  },
  processing: {
    className: 'bg-[#0d49fb]! text-white!',
    label: 'En cours',
  },
} satisfies Record<
  Jobs['status'],
  {
    label: string;
    className: string;
  }
>;

type JobStatusBadgeProps = {
  status: Jobs['status'];
};

/**
 * Affiche un badge avec le statut d'une tâche.
 *
 * @param status - Le statut de la tâche
 */
const JobStatusBadge = ({ status }: JobStatusBadgeProps) => {
  const config = jobStatusConfig[status];
  return (
    <Badge small className={config.className}>
      {config.label}
    </Badge>
  );
};

export default JobStatusBadge;
