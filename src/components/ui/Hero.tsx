import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import Image from '@/components/ui/Image';
import cx from '@/utils/cx';

import Heading from './Heading';

const heroContainerVariants = cva('relative', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    variant: {
      normal: 'bg-[#C3E4E1] [&_article]:bg-[#C3E4E1]/90',
      light: 'bg-light [&_article]:bg-light/90',
      accent: 'bg-accent text-white [&_article]:bg-accent/90',
      city: 'bg-blue-light',
      ressource: 'bg-blueCumulus-_950_100',
      transparent: 'bg-transparent',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'normal',
  },
});
const heroVariants = cva('relative', {
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
const articleVariants = cva('flex-1 flex flex-col', {
  variants: {
    size: {
      sm: 'gap-2',
      md: 'gap-4 py-4w 2xl:py-6w',
      lg: 'gap-8 py-6w 2xl:py-8w',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type HeroProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof heroContainerVariants> & {
    image?: string;
    imageClassName?: string;
    imageType?: 'floating' | 'inline' | 'inline-cover';
    imagePosition?: 'left' | 'right';
    imageRatio?: string;
  };

const HeroContext = React.createContext<VariantProps<typeof heroContainerVariants> & { bigTitle?: boolean }>({});

/**
 * Hero component for creating prominent header sections
 *
 * @example
 * ```tsx
 * <Hero
 *   image="/path/to/image.jpg"
 *   imagePosition="right"
 *   imageType="inline"
 *   variant="normal"
 *   size="md"
 * >
 *   <HeroMeta>Optional meta text</HeroMeta>
 *   <HeroTitle>Main Title</HeroTitle>
 *   <HeroSubtitle>Subtitle</HeroSubtitle>
 *   <HeroContent>A form, for example</HeroContent>
 * </Hero>
 * ```
 */
const Hero = ({
  children,
  className,
  image,
  size,
  imageClassName = '',
  imageType = 'floating',
  imagePosition = 'left',
  imageRatio,
  variant,
  ...props
}: HeroProps) => {
  const bigTitle = !image || imageType === 'inline' || imageType === 'inline-cover';

  const ratio = imageRatio ?? (bigTitle ? '1/3' : '1/2');

  const [imageFlex, allFlex] = ratio.split('/').map(Number);
  const titleFlex = allFlex - imageFlex;

  return (
    <HeroContext.Provider value={{ size, variant, bigTitle }}>
      <section className={cx(heroContainerVariants({ variant }), className)} {...props}>
        {image && imageType === 'floating' && (
          <div className="absolute top-0 left-0 right-0 bottom-0 hidden lg:block">
            <Image
              src={image}
              alt=""
              className={cx('h-full absolute top-0 w-auto object-cover', imagePosition === 'left' ? 'left-0' : 'right-0', imageClassName)}
              sizes="100vw"
              priority
              width={400}
              height={500}
              fetchPriority="high"
            />
          </div>
        )}
        <div
          className={cx('fr-container flex relative', heroVariants({ size }), imagePosition === 'right' ? 'flex-row-reverse' : 'flex-row')}
        >
          {image && (
            <div className={cx('hidden lg:block', `flex-${imageFlex}`)}>
              {['inline', 'inline-cover'].includes(imageType) && (
                <div className={cx('relative h-full')}>
                  <Image
                    src={image}
                    alt=""
                    className={cx(
                      'w-full h-full',
                      imageType === 'inline-cover' ? 'object-cover' : 'object-contain',
                      imagePosition === 'right' ? 'object-right left-auto!' : 'object-left right-auto!',
                      imageClassName
                    )}
                    priority
                    fill
                    fetchPriority="high"
                  />
                </div>
              )}
            </div>
          )}
          <article className={cx(articleVariants({ size }), `flex-${titleFlex}`, bigTitle ? '' : 'px-2')}>{children}</article>
        </div>
      </section>
    </HeroContext.Provider>
  );
};

const headingVariants = cva('my-0!', {
  variants: {
    variant: {
      normal: 'text-blue!',
      light: 'text-black!',
      accent: 'text-white!',
      city: 'text-black!',
      ressource: 'text-black!',
      transparent: 'text-black!',
    },
  },
  defaultVariants: {
    variant: 'normal',
  },
});

const titleVariants = (props: VariantProps<typeof headingVariants>) =>
  cx(
    '[&_strong]:font-extrabold', // Use & to bypass DSFR !important
    headingVariants(props)
  );

export type HeroTitleProps = React.ComponentProps<typeof Heading> & VariantProps<typeof titleVariants>;

export const HeroTitle = ({ children, className, ...props }: React.ComponentProps<typeof Heading>) => {
  const { bigTitle, ...contextVariants } = React.useContext(HeroContext);

  return (
    <Heading
      as="h1"
      size={bigTitle ? 'h1' : 'h2'}
      className={cx(titleVariants(contextVariants satisfies VariantProps<typeof headingVariants>), className)}
      {...props}
    >
      {children}
    </Heading>
  );
};

const subtitleVariants = cva('my-0!', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    variant: {
      normal: 'text-gray-900!',
      light: 'text-gray-900!',
      accent: 'text-gray-100!',
      city: 'text-gray-900!',
      ressource: 'text-gray-900!',
      transparent: 'text-gray-900!',
    },
  },
  defaultVariants: {
    variant: 'normal',
    size: 'md',
  },
});

export const HeroSubtitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  const contextVariants = React.useContext(HeroContext);
  return (
    <p className={cx(subtitleVariants(contextVariants), className)} {...props}>
      {children}
    </p>
  );
};

const contentVariants = cva('', {
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

export const HeroContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const contextVariants = React.useContext(HeroContext);
  return (
    <div className={cx(contentVariants(contextVariants), className)} {...props}>
      {children}
    </div>
  );
};

const metaVariants = cva('uppercase text-sm font-bold tracking-tighter', {
  variants: {
    variant: {
      normal: 'text-gray-700!',
      light: 'text-gray-700!',
      accent: 'text-gray-100!',
      city: 'text-gray-700!',
      ressource: 'text-gray-700!',
      transparent: 'text-gray-700!',
    },
  },
  defaultVariants: {
    variant: 'normal',
  },
});
export const HeroMeta = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const contextVariants = React.useContext(HeroContext);
  return (
    <div className={cx(metaVariants(contextVariants), className)} {...props}>
      {children}
    </div>
  );
};

export default Hero;
