import { type BadgeProps, Badge as DSFRBadge } from '@codegouvfr/react-dsfr/Badge';
import { cva, type VariantProps } from 'class-variance-authority';

import Tooltip from '@/components/ui/Tooltip';
import cx from '@/utils/cx';

type TypeBadge = 'haut_potentiel' | 'pdp' | 'warning_ville_differente' | 'api_user' | 'actif';

const badgeCva = cva('block!', {
  defaultVariants: {
    size: 'sm',
  },
  variants: {
    size: {
      lg: 'text-lg! py-2! px-4!',
      md: 'text-base! py-1.5! px-3!',
      sm: '',
      xs: 'text-[10px]! py-0.5! px-1! leading-none! min-h-min!',
    },
    type: {
      actif: '',
      api_user: 'bg-[#FFDA8F]! text-[#454B58]!',
      haut_potentiel: 'bg-green-600! text-white!',
      pdp: 'bg-[#FFDA8F]! text-[#454B58]!',
      warning_ville_differente: 'bg-[#FFDA8F]! text-[#454B58]!',
    },
  },
});

const badgeLabels: Record<TypeBadge, string> = {
  actif: 'Actif',
  api_user: 'API',
  haut_potentiel: 'HP',
  pdp: 'PDP',
  warning_ville_differente: 'Ville différente',
};

const badgeTitles: Partial<Record<TypeBadge, string>> = {
  api_user: 'Utilisateur créé depuis l’API',
  haut_potentiel:
    'Haut potentiel. Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100 logements, ou tertiaires.',
  warning_ville_differente: 'La ville de la demande ne correspond pas aux villes du réseau',
};

const badgeSeverities: Partial<Record<TypeBadge, BadgeProps['severity']>> = {
  actif: 'info',
  warning_ville_differente: 'warning',
};

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
      className={cx(badgeCva({ size, type }), className)}
      severity={severity}
      {...props}
    >
      {label}
    </DSFRBadge>
  );
  return tooltipTitle ? <Tooltip title={tooltipTitle}>{badgeElement}</Tooltip> : badgeElement;
};

export default Badge;
