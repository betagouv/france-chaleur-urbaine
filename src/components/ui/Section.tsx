import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import cx from '@/utils/cx';

import Heading from './Heading';

const sectionVariants = cva('', {
  variants: {
    size: {
      sm: '',
      md: 'py-10w',
      lg: '',
    },
    variant: {
      normal: '',
      light: 'bg-blueFrance-_975_75',
      accent: 'bg-blueFrance-main525 text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'normal',
  },
});

export type SectionProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof sectionVariants>;

const SectionContext = React.createContext<VariantProps<typeof sectionVariants>>({});

/**
 * Section component for creating page sections with consistent styling
 *
 * @example
 * ```tsx
 * <Section variant="light" size="md">
 *   <SectionTitle>Main Section Title</SectionTitle>
 *   <SectionSubtitle>Optional subtitle text</SectionSubtitle>
 *   <SectionTwoColumns><div>Section 1</div><div>Section 2</div></SectionTwoColumns>
 *   <SectionContent>
 *     <SectionHeading as="h3">Section heading</SectionHeading>
 *      Any content
 *   </SectionContent>
 * </Section>
 * ```
 */

const Section = ({ children, className, size, variant, ...props }: SectionProps) => {
  return (
    <SectionContext.Provider value={{ size, variant }}>
      <section className={cx(sectionVariants({ size, variant }), className)} {...props}>
        <div className="fr-container">{children}</div>
      </section>
    </SectionContext.Provider>
  );
};

const headingVariants = cva('', {
  variants: {
    variant: {
      normal: '!text-black',
      light: '!text-black',
      accent: '!text-white',
    },
  },
  defaultVariants: {
    variant: 'normal',
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
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
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

export const SectionSubtitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
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

const contentVariants = cva('', {
  variants: {
    size: {
      sm: 'mt-2w',
      md: 'mt-6w',
      lg: 'mt-8w',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const SectionContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const contextVariants = React.useContext(SectionContext);
  return (
    <div className={cx(contentVariants(contextVariants), className)} {...props}>
      {children}
    </div>
  );
};

const twoColumnsVariants = cva('flex flex-col lg:flex-row [&>*]:flex-1', {
  variants: {
    size: {
      sm: '',
      md: 'gap-8',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const SectionTwoColumns = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  const contextVariants = React.useContext(SectionContext);
  return (
    <div className={cx(contentVariants(contextVariants), twoColumnsVariants(contextVariants), className)} {...props}>
      {children}
    </div>
  );
};

export default Section;
