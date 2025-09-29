import { Badge as DSFRBadge, type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import { cva, type VariantProps } from 'class-variance-authority';

import Tooltip from '@/components/ui/Tooltip';
import cx from '@/utils/cx';

const badgeCva = cva('block!', {
  variants: {
    type: {
      haut_potentiel: 'bg-green-600! text-white!',
      pdp: 'bg-[#FFDA8F]! text-[#454B58]!',
      warning_ville_differente: 'bg-[#FFDA8F]! text-[#454B58]!',
      api_user: 'bg-[#FFDA8F]! text-[#454B58]!',
    },
    size: {
      xs: 'text-[10px]! py-0.5! px-1! leading-none! min-h-min!',
      sm: '',
      md: 'text-base! py-1.5! px-3!',
      lg: 'text-lg! py-2! px-4!',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

const badgeLabels: Record<TypeBadge, string> = {
  haut_potentiel: 'HP',
  pdp: 'PDP',
  warning_ville_differente: 'Ville différente',
  api_user: 'API',
};

const badgeTitles: Partial<Record<TypeBadge, string>> = {
  haut_potentiel:
    'Haut potentiel. Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100 logements, ou tertiaires.',
  warning_ville_differente: 'La ville de la demande ne correspond pas aux villes du réseau',
  api_user: 'Utilisateur créé depuis l’API',
};

const badgeSeverities: Partial<Record<TypeBadge, BadgeProps['severity']>> = {
  warning_ville_differente: 'warning',
};

type TypeBadge = 'haut_potentiel' | 'pdp' | 'warning_ville_differente' | 'api_user';

type FCUBadgeProps = VariantProps<typeof badgeCva> & {
  title?: string;
  type: TypeBadge;
  className?: string;
} & Omit<BadgeProps, 'type' | 'size' | 'className' | 'severity' | 'small' | 'children'>;

const Badge = ({ as = 'span', type, className, title, size = 'sm', ...props }: FCUBadgeProps) => {
  const label = badgeLabels[type];
  const tooltipTitle = title ?? badgeTitles[type];
  const severity = badgeSeverities[type];

  const badgeElement = (
    <DSFRBadge
      as={as}
      small={size === 'xs' || size === 'sm'}
      className={cx(badgeCva({ type, size }), className)}
      severity={severity}
      {...props}
    >
      {label}
    </DSFRBadge>
  );
  return tooltipTitle ? <Tooltip title={tooltipTitle}>{badgeElement}</Tooltip> : badgeElement;
};

export default Badge;
