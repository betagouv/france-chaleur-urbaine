import { cva, type VariantProps } from 'class-variance-authority';
import Image from 'next/image';
import React from 'react';

import cx from '@/utils/cx';

import Heading from './Heading';

const heroVariants = cva('relative', {
  variants: {
    size: {
      sm: '',
      md: 'py-4w 2xl:py-8w',
      lg: '',
    },
    variant: {
      normal: 'bg-[#C3E4E1] [&_article]:bg-[#C3E4E1]/90',
      light: 'bg-blueFrance-_975_75 [&_article]:bg-blueFrance-_975_75/90',
      accent: 'bg-blueFrance-main525 text-white [&_article]:bg-blueFrance-main525/90',
      city: 'bg-[#B2D6F2]',
      transparent: 'bg-transparent',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'normal',
  },
});

export type HeroProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof heroVariants> & { image?: string; imageClassName?: string };

const HeroContext = React.createContext<VariantProps<typeof heroVariants>>({});

/**
 * Hero component for creating prominent header sections
 *
 * @example
 * ```tsx
 * <Hero
 *   image="/path/to/image.jpg"
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
const Hero = ({ children, className, image, size, imageClassName = '', variant, ...props }: HeroProps) => {
  return (
    <HeroContext.Provider value={{ size, variant }}>
      <section className={cx(heroVariants({ size, variant }), className)} {...props}>
        {image && (
          <div className="absolute top-0 left-0 right-0 bottom-0 hidden lg:block">
            <Image
              src={image}
              alt=""
              className={cx('h-full absolute top-0 left-0 w-auto object-cover', imageClassName)}
              sizes="100vw"
              priority
              width={400}
              height={500}
            />
          </div>
        )}
        <div className="fr-container flex relative">
          <div className="flex-1 hidden lg:block">&nbsp;</div>
          <article className="flex-1 px-2 py-2w lg:pr-0">{children}</article>
        </div>
      </section>
    </HeroContext.Provider>
  );
};

const headingVariants = cva('', {
  variants: {
    variant: {
      normal: '!text-blue',
      light: '!text-black',
      accent: '!text-white',
      city: '!text-black',
      transparent: '!text-black',
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
  const contextVariants = React.useContext(HeroContext);

  return (
    <Heading as="h1" size="h2" className={cx(titleVariants(contextVariants), className)} {...props}>
      {children}
    </Heading>
  );
};

const subtitleVariants = cva('', {
  variants: {
    size: {
      sm: 'text-sm mb-2w',
      md: 'text-base mb-3w',
      lg: 'text-lg mb-4w',
    },
    variant: {
      normal: '!text-gray-900',
      light: '!text-gray-900',
      accent: '!text-gray-100',
      city: '!text-gray-900',
      transparent: '!text-gray-900',
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

export const HeroContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

const metaVariants = cva('uppercase text-sm font-bold tracking-tighter', {
  variants: {
    variant: {
      normal: '!text-gray-700',
      light: '!text-gray-700',
      accent: '!text-gray-100',
      city: '!text-gray-700',
      transparent: '!text-gray-700',
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
