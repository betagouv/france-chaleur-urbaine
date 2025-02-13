import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import cx from '@/utils/cx';

import Heading from './Heading';

const heroVariants = cva('', {
  variants: {
    size: {
      sm: '',
      md: 'py-10w',
      lg: '',
    },
    variant: {
      normal: 'bg-[#C3E4E1]',
      light: 'bg-blueFrance-_975_75',
      accent: 'bg-blueFrance-main525 text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'normal',
  },
});

export type HeroProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof heroVariants>;

const HeroContext = React.createContext<VariantProps<typeof heroVariants>>({});

const Hero = ({ children, className, size, variant, ...props }: HeroProps) => {
  return (
    <HeroContext.Provider value={{ size, variant }}>
      <section className={cx(heroVariants({ size, variant }), className)} {...props}>
        <div className="fr-container flex">
          <div className="flex-1">&nbsp;</div>
          <div className="flex-1 px-2 lg:px-0">{children}</div>
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
    },
  },
  defaultVariants: {
    variant: 'normal',
  },
});

const titleVariants = (props: VariantProps<typeof headingVariants>) => cx('', headingVariants(props));

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
      md: 'text-base mb-6w',
      lg: 'text-lg mb-8w',
    },
    variant: {
      normal: '!text-gray-900',
      light: '!text-gray-900',
      accent: '!text-gray-100',
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
export const HeroImage = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

const metaVariants = cva('uppercase text-sm font-bold tracking-tighter', {
  variants: {
    variant: {
      normal: '!text-gray-700',
      light: '!text-gray-700',
      accent: '!text-gray-100',
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
