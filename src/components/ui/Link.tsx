import NextLink from 'next/link';
import type { PropsWithChildren } from 'react';

import { type TrackingEvent, trackEvent } from '@/modules/analytics/client';

import { type SpacingProperties, spacingsToClasses } from './helpers/spacings';

const linkVariantToClass = {
  link: 'fr-link d-inline-block',
  primary: 'fr-btn',
  secondary: 'fr-btn fr-btn--secondary',
  tertiary: 'fr-btn fr-btn--tertiary',
  tertiaryNoOutline: 'fr-btn fr-btn--tertiary-no-outline',
  text: '',
} as const;

interface LinkProps extends SpacingProperties {
  href: string;
  event?: string;
  eventKey?: TrackingEvent;
  eventPayload?: string;
  className?: string;
  variant?: keyof typeof linkVariantToClass;
  isExternal?: boolean;
  stopPropagation?: boolean;
  title?: string;
  style?: React.CSSProperties;
  onClick?: (e?: any) => void;
  prefetch?: boolean;
}

/**
 * Renders a DSFR link that uses Next Link.
 * Automatically use a 'a' element when the href contains an anchor to fix scrolling issues.
 * Can track analytics events.
 * Usage:
 *  <Link href="https://url.com" eventKey="Téléchargement|Tracés|carte">Télécharger un tracé</Link>
 */
function Link({
  children,
  href,
  eventKey,
  eventPayload,
  className = '',
  variant = 'text',
  isExternal = false,
  stopPropagation = false,
  title,
  prefetch = false,
  onClick,
  ...props
}: PropsWithChildren<LinkProps>) {
  // when the href contains an anchor, use a classic link which works best with scrolling
  const Tag = href.includes('#') ? 'a' : NextLink;
  return (
    <Tag
      href={href}
      title={title}
      onClick={(e) => {
        if (stopPropagation) {
          e.stopPropagation();
        }
        if (eventKey) {
          trackEvent(
            eventKey,
            eventPayload?.split(',').map((v) => v.trim())
          );
        }
        onClick?.(e);
      }}
      className={`${className} ${linkVariantToClass[variant]} ${spacingsToClasses(props)}`}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      {...(Tag === 'a' ? {} : { prefetch })}
      {...props}
    >
      {children}
    </Tag>
  );
}
export default Link;
