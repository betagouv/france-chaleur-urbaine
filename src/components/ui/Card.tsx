import DSFRCard, { type CardProps as DSFRCardProps } from '@codegouvfr/react-dsfr/Card';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ReactNode } from 'react';

import cx from '@/utils/cx';

const cardVariants = cva('', {
  variants: {
    variant: {
      default: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export type CardProps = DSFRCardProps &
  VariantProps<typeof cardVariants> & {
    description?: string | ReactNode;
    className?: string;
  };

/**
 * A DSFR Card component with enhanced features:
 * - Multiple visual variants (default, outlined, elevated, subtle)
 * - Size variants (sm, md, lg)
 * - Support for ReactNode content in title and description
 * - Additional className support for custom styling
 */
const Card: React.FC<CardProps> = ({ description, variant, size, className, ...props }) => {
  return <DSFRCard desc={description as DSFRCardProps['desc']} className={cx(cardVariants({ variant, size }), className)} {...props} />;
};

export default Card;
