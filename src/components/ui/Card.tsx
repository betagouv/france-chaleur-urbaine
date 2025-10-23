import DSFRCard, { type CardProps as DSFRCardProps } from '@codegouvfr/react-dsfr/Card';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { type TrackingEvent, trackEvent } from '@/modules/analytics/client';
import cx from '@/utils/cx';

const cardVariants = cva('', {
  defaultVariants: {
    imageAspect: 'default',
    size: 'md',
    variant: 'default',
  },
  variants: {
    imageAspect: {
      default: '',
      square: '[.fr-card__img>img]:aspect-square',
    },
    size: {
      lg: '',
      md: '',
      sm: '',
    },
    variant: {
      default: '',
      size: 'md',
    },
  },
});

export type CardProps = Omit<DSFRCardProps, 'size'> &
  VariantProps<typeof cardVariants> & {
    description?: string | ReactNode;
    className?: string;
    eventKey?: TrackingEvent;
    eventPayload?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  };

/**
 * A DSFR Card component with enhanced features:
 * - Multiple visual variants (default, outlined, elevated, subtle)
 * - Size variants (sm, md, lg)
 * - Support for ReactNode content in title and description
 * - Additional className support for custom styling
 */
const Card: React.FC<CardProps> = ({ description, variant, size, className, eventKey, eventPayload, onClick, ...props }) => {
  return (
    <DSFRCard
      size={size === 'sm' ? 'small' : size === 'md' ? 'medium' : 'large'}
      desc={description as DSFRCardProps['desc']}
      className={cx(cardVariants({ size, variant }), className)}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (eventKey) {
          trackEvent(
            eventKey,
            eventPayload?.split(',').map((v) => v.trim())
          );
        }
        onClick?.(e);
      }}
      {...(props as any)}
    />
  );
};

export default Card;
