import { Badge as DSFRBadge, type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import { type ReactNode } from 'react';

import Tooltip from '@/components/ui/Tooltip';
import cx from '@/utils/cx';

type BadgeConfig = {
  label: string;
  title?: string;
  className: string;
  severity?: BadgeProps['severity'];
};
const badgeConfigs = {
  haut_potentiel: {
    label: 'HP',
    title:
      'Haut potentiel. Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100 logements, ou tertiaires.',
    className: '!bg-green-600 !text-white',
  },
  pdp: { label: 'PDP', className: '!bg-[#FFDA8F] !text-[#454B58]' },
  warning_ville_differente: {
    severity: 'warning',
    label: 'Ville différente',
    title: 'La ville de la demande ne correspond pas aux villes du réseau',
    className: '!bg-[#FFDA8F] !text-[#454B58]',
  },
  api_user: {
    label: 'API',
    title: 'Utilisateur créé depuis l’API',
    className: '!bg-[#FFDA8F] !text-[#454B58]',
  },
} satisfies Record<string, BadgeConfig>;

type TypeBadge = keyof typeof badgeConfigs;

type FCUBadgeProps = {
  type: TypeBadge;
  className?: string;
  title?: ReactNode;
};

const Badge = ({ type, className, title }: FCUBadgeProps) => {
  const config = badgeConfigs[type] as BadgeConfig;
  const badgeElement = (
    <DSFRBadge small className={cx('!block', className, config.className)} severity={config.severity}>
      {config.label}
    </DSFRBadge>
  );
  return config.title ? <Tooltip title={title ?? config.title}>{badgeElement}</Tooltip> : badgeElement;
};

export default Badge;
