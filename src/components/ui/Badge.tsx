import { Badge as DSFRBadge } from '@codegouvfr/react-dsfr/Badge';

import Tooltip from '@/components/ui/Tooltip';
import cx from '@/utils/cx';

type BadgeConfig = {
  label: string;
  title?: string;
  className: string;
};
const badgeConfigs = {
  haut_potentiel: {
    label: 'HP',
    title:
      'Haut potentiel. Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100 logements, ou tertiaires.',
    className: '!bg-green-600 !text-white',
  },
  pdp: { label: 'PDP', className: '!bg-[#FFDA8F] !text-[#454B58]' },
} satisfies Record<string, BadgeConfig>;

type TypeBadge = keyof typeof badgeConfigs;

type FCUBadgeProps = {
  type: TypeBadge;
};

const Badge = ({ type }: FCUBadgeProps) => {
  const config = badgeConfigs[type] as BadgeConfig;
  const badgeElement = (
    <DSFRBadge small className={cx('!block', config.className)}>
      {config.label}
    </DSFRBadge>
  );
  return config.title ? <Tooltip title={config.title}>{badgeElement}</Tooltip> : badgeElement;
};

export default Badge;
