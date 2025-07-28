import { CallOut as DSFRCallOut, type CallOutProps as DSFRCallOutProps } from '@codegouvfr/react-dsfr/CallOut';
import { cva, type VariantProps } from 'class-variance-authority';

import cx from '@/utils/cx';

const callOutVariants = cva('relative', {
  variants: {
    variant: {
      default: '',
      blue: '!bg-[image:linear-gradient(0deg,var(--border-action-high-blue-france),var(--border-action-high-blue-france))]',
      info: '!bg-[image:linear-gradient(0deg,var(--border-action-high-info),var(--border-action-high-info))]',
      success: '!bg-[image:linear-gradient(0deg,var(--border-action-high-success),var(--border-action-high-success))]',
      warning: '!bg-[image:linear-gradient(0deg,var(--border-action-high-warning),var(--border-action-high-warning))]',
      error: '!bg-[image:linear-gradient(0deg,var(--border-action-high-error),var(--border-action-high-error))]',
    },
    size: {
      sm: '!px-8 !py-6',
      md: '',
      lg: '',
    },
    withImage: {
      true: '!pl-28 !pr-4',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const titleVariants = cva('', {
  variants: {
    size: {
      sm: '!text-base',
      md: '!text-lg',
      lg: '!text-2xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const textVariants = cva('', {
  variants: {
    size: {
      sm: '!text-sm',
      md: '!text-base',
      lg: '!text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type CallOutProps = VariantProps<typeof callOutVariants> & DSFRCallOutProps & { image?: string };

const CallOut = ({ children, className, variant, size, image, bodyAs, ...props }: CallOutProps) => {
  return (
    <DSFRCallOut
      bodyAs={bodyAs || (typeof children !== 'string' ? 'div' : undefined)}
      classes={{
        root: cx(callOutVariants({ variant, size, withImage: !!image }), className),
        title: titleVariants({ size }),
        text: textVariants({ size }),
        button: undefined,
      }}
      {...props}
    >
      {image && (
        <div className="z-10 w-24 absolute top-0 bottom-0 left-2 [&>img]:w-full flex items-center justify-center">
          <img src={image} alt="Icône d'illustration" />
        </div>
      )}
      {children}
    </DSFRCallOut>
  );
};

export default CallOut;
