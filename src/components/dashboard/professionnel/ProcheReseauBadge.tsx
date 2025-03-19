import Badge from '@codegouvfr/react-dsfr/Badge';

const procheReseauConfig = {
  aucun: {
    label: 'Non',
    className: '!bg-destructive !text-white',
  },
  existant: {
    label: 'Existant',
    className: '!bg-[#079067] !text-white',
  },
  en_construction: {
    label: 'À venir',
    className: '!bg-[#DA5DD5] !text-white',
  },
} satisfies Record<
  string,
  {
    label: string;
    className: string;
  }
>;

type ProcheReseauBadgeProps = {
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
