import Badge from '@codegouvfr/react-dsfr/Badge';

const procheReseauConfig = {
  aucun: {
    className: 'bg-destructive! text-white!',
    label: 'Non',
  },
  en_construction: {
    className: 'bg-[#DA5DD5]! text-white!',
    label: 'À venir',
  },
  existant: {
    className: 'bg-[#079067]! text-white!',
    label: 'Existant',
  },
} satisfies Record<
  string,
  {
    label: string;
    className: string;
  }
>;

export type ProcheReseauBadgeProps = {
  type: keyof typeof procheReseauConfig;
};

/**
 * Affiche un badge avec le type de réseau proche (aucun, existant, en construction).
 *
 * @param type - Le type de réseau proche
 */
const ProcheReseauBadge = ({ type }: ProcheReseauBadgeProps) => {
  const config = procheReseauConfig[type] ?? procheReseauConfig.aucun;
  return (
    <Badge small className={config.className}>
      {config.label}
    </Badge>
  );
};

export default ProcheReseauBadge;
