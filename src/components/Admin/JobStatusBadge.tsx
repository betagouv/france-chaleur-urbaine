import Badge from '@codegouvfr/react-dsfr/Badge';

import { type Jobs } from '@/server/db/kysely';

const jobStatusConfig = {
  pending: {
    label: 'En attente',
    className: 'bg-gray-500! text-white!',
  },
  processing: {
    label: 'En cours',
    className: 'bg-[#0d49fb]! text-white!',
  },
  finished: {
    label: 'Terminée',
    className: 'bg-success! text-white!',
  },
  error: {
    label: 'Erreur',
    className: 'bg-destructive! text-white!',
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
