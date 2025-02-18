import { type RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import { Tile as DSFRTile, type TileProps as DSFRTileProps } from '@codegouvfr/react-dsfr/Tile';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import React from 'react';

type TileSize = 'sm' | 'md' | 'lg';

type BaseTileProps = Omit<DSFRTileProps, 'small' | 'imageUrl' | 'linkProps'> & {
  linkProps: RegisteredLinkProps;
};

export type TileProps = BaseTileProps & {
  size?: TileSize;
  image?: string;
};

const tileVariants = cva('', {
  variants: {
    size: {
      sm: '',
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
const Tile: React.FC<TileProps> = ({ size = 'md', className, image, linkProps, ...props }) => {
  const imageUrl = image && !image.startsWith('http') ? `${process.env.NEXT_PUBLIC_MAP_ORIGIN}${image}` : image;
  const router = useRouter();
  const { href, onClick, ...restLinkProps } = linkProps;

  return (
    <DSFRTile
      classes={{
        header: headerVariants({ size }),
        img: imgVariants({ size }),
      }}
      className={tileVariants({ size, className })}
      small={size === 'sm'}
      imageUrl={imageUrl}
      linkProps={{
        href, // needed so that Tile works as it's a mandatory field
        onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault(); // override the href behavior as it would navigate to other page and refresh the page
          onClick?.(e);
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
