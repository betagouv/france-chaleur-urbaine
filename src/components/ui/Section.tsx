import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import cx from '@/utils/cx';

import Box from './Box';
import Heading from './Heading';
import type Text from './Text';

const sectionVariants = cva('', {
  variants: {
    size: {
      sm: '',
      md: 'py-10w',
      lg: '',
    },
    color: {
      normal: '',
      light: 'bg-blueFrance-_975_75',
      accent: 'bg-blueFrance-main525 text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'normal',
  },
});

export type SectionProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof sectionVariants>;

const SectionContext = React.createContext<VariantProps<typeof sectionVariants>>({});

const Section = ({ children, className, size, color, ...props }: SectionProps) => {
  return (
    <SectionContext.Provider value={{ size, color }}>
      <section className={cx(sectionVariants({ size, color }), className)} {...props}>
        <div className="fr-container">{children}</div>
      </section>
    </SectionContext.Provider>
  );
};

const headingVariants = cva('', {
  variants: {
    color: {
      normal: '!text-blue',
      light: '!text-black',
      accent: '!text-white',
    },
  },
  defaultVariants: {
    color: 'normal',
  },
});

const titleVariants = (props: VariantProps<typeof headingVariants>) => cx('text-center', headingVariants(props));

export type SectionTitleProps = React.ComponentProps<typeof Heading> & VariantProps<typeof titleVariants>;

export const SectionTitle = ({ children, className, ...props }: React.ComponentProps<typeof Heading>) => {
  const contextVariants = React.useContext(SectionContext);

  return (
    <Heading as="h2" size="h2" className={cx(titleVariants(contextVariants), className)} {...props}>
      {children}
    </Heading>
  );
};

const subtitleVariants = cva('text-center max-w-[640px] mx-auto', {
  variants: {
    size: {
      sm: 'text-sm mb-2w',
      md: 'text-base mb-6w',
      lg: 'text-lg mb-8w',
    },
    color: {
      normal: '!text-gray-900',
      light: '!text-gray-900',
      accent: '!text-gray-100',
    },
  },
  defaultVariants: {
    color: 'normal',
    size: 'md',
  },
});

export const SectionSubtitle = ({ children, className, ...props }: React.ComponentProps<typeof Text>) => {
  const contextVariants = React.useContext(SectionContext);
  return (
    <p className={cx(subtitleVariants(contextVariants), className)} {...props}>
      {children}
    </p>
  );
};

export const SectionHeading = ({ children, className, ...props }: React.ComponentProps<typeof Heading>) => {
  const contextVariants = React.useContext(SectionContext);
  return (
    <Heading className={cx(headingVariants(contextVariants), className)} {...props}>
      {children}
    </Heading>
  );
};

const twoColumnsVariants = cva('flex flex-col lg:flex-row [&>*]:flex-1', {
  variants: {
    size: {
      sm: '',
      md: 'my-10w gap-8',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const SectionTwoColumns = ({ children, className, ...props }: React.ComponentProps<typeof Heading>) => {
  const contextVariants = React.useContext(SectionContext);
  return (
    <div className={cx(twoColumnsVariants(contextVariants), className)} {...props}>
      {children}
    </div>
  );
};

export const SectionContent = ({ children, ...props }: React.ComponentProps<typeof Box>) => {
  return <Box {...props}>{children}</Box>;
};

export default Section;
