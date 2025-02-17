import { Tile as DSFRTile, type TileProps as DSFRTileProps } from '@codegouvfr/react-dsfr/Tile';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import React from 'react';

type TileSize = 'sm' | 'md' | 'lg';

type BaseTileProps = Omit<DSFRTileProps, 'small' | 'imageUrl'>;

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

const Tile: React.FC<TileProps> = ({ size = 'md', className, image, ...props }) => {
  const imageUrl = image && !image.startsWith('http') ? `${process.env.NEXT_PUBLIC_MAP_ORIGIN}${image}` : image;
  const router = useRouter();
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
        ...props.linkProps,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          if (props.linkProps?.href) {
            router.push(props.linkProps.href as string);
          }
        },
      }}
      {...(props as any)}
    />
  );
};

export default Tile;
