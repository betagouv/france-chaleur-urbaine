import Badge from '@codegouvfr/react-dsfr/Badge';

import { type Jobs } from '@/server/db/kysely';

const jobStatusConfig = {
  pending: {
    label: 'En attente',
    style: {
      backgroundColor: '#666666',
      color: '#fff',
    },
  },
  processing: {
    label: 'En cours',
    style: {
      backgroundColor: '#0d49fb',
      color: '#fff',
    },
  },
  finished: {
    label: 'Terminée',
    style: {
      backgroundColor: '#1b8450',
      color: '#fff',
    },
  },
  error: {
    label: 'Erreur',
    style: {
      backgroundColor: '#e31717',
      color: '#fff',
    },
  },
} satisfies Record<
  Jobs['status'],
  {
    label: string;
    style: {
      backgroundColor: string;
      color: string;
    };
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
    <Badge small style={config.style}>
      {config.label}
    </Badge>
  );
};

export default JobStatusBadge;
