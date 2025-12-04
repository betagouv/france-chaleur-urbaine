import type { RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import { Tile as DSFRTile, type TileProps as DSFRTileProps } from '@codegouvfr/react-dsfr/Tile';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import type React from 'react';

import { type TrackingEvent, trackEvent } from '@/modules/analytics/client';

type TileSize = 'sm' | 'md' | 'lg';

type BaseTileProps = Omit<DSFRTileProps, 'small' | 'imageUrl' | 'linkProps'> & {
  linkProps: RegisteredLinkProps;
  eventKey?: TrackingEvent;
  eventPayload?: string;
};

export type TileProps = BaseTileProps & {
  size?: TileSize;
  image?: string;
};

const tileVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      lg: '',
      md: '',
      sm: 'pt-4! px-4! pb-5!',
    },
  },
});

const headerVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      lg: '',
      md: '',
      sm: 'mr-1!',
    },
  },
});

const imgVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      lg: '',
      md: '',
      sm: 'mr-0!',
    },
  },
});

const contentVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      lg: '',
      md: '',
      sm: 'pb-6!',
    },
  },
});

/**
 * A DSFR tile component with enhanced features:
 * - Size variants via `size` prop (sm, md, lg)
 * - Automatic external link handling
 *
 * @example
 * ```tsx
 * <Tile
 *   size="md"
 *   title="Tile Title"
 *   desc="Description text"
 *   image="/path/to/image.jpg"
 *   linkProps={{
 *     href: "/some-path",
 *     onClick: () => console.log("clicked")
 *   }}
 * />
 * ```
 */
const Tile: React.FC<TileProps> = ({ size = 'md', className, image, linkProps, eventKey, eventPayload, ...props }) => {
  const router = useRouter();
  const { href, onClick, ...restLinkProps } = linkProps;

  return (
    <DSFRTile
      classes={{
        content: contentVariants({ size }),
        header: headerVariants({ size }),
        img: imgVariants({ size }),
      }}
      className={tileVariants({ className, size })}
      small={size === 'sm'}
      imageUrl={image}
      linkProps={{
        href,
        onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          onClick?.(e);

          if (eventKey) {
            trackEvent(
              eventKey,
              eventPayload?.split(',').map((v) => v.trim())
            );
          }

          if (href) {
            if ((href as string).startsWith('http')) {
              window.open(href as string, '_blank');
            } else {
              router.push(href as string);
            }
          }
        },
        ...restLinkProps,
      }}
      {...(props as any)}
    />
  );
};

export default Tile;
