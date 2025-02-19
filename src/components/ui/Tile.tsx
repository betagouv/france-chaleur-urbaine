import { type RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import { Tile as DSFRTile, type TileProps as DSFRTileProps } from '@codegouvfr/react-dsfr/Tile';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import React from 'react';

import { trackEvent, type TrackingEvent } from '@/services/analytics';

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
  variants: {
    size: {
      sm: '!pt-[1rem] !px-[1rem] !pb-[1.25rem]',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const headerVariants = cva('', {
  variants: {
    size: {
      sm: '!mr-1',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const imgVariants = cva('', {
  variants: {
    size: {
      sm: '!mr-0',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const contentVariants = cva('', {
  variants: {
    size: {
      sm: '!pb-[1.5rem]',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
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
  const imageUrl = image && !image.startsWith('http') ? `${process.env.NEXT_PUBLIC_MAP_ORIGIN}${image}` : image;
  const router = useRouter();
  const { href, onClick, ...restLinkProps } = linkProps;

  return (
    <DSFRTile
      classes={{
        header: headerVariants({ size }),
        img: imgVariants({ size }),
        content: contentVariants({ size }),
      }}
      className={tileVariants({ size, className })}
      small={size === 'sm'}
      imageUrl={imageUrl}
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
