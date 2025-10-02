import { CallOut as DSFRCallOut, type CallOutProps as DSFRCallOutProps } from '@codegouvfr/react-dsfr/CallOut';
import { cva, type VariantProps } from 'class-variance-authority';

import cx from '@/utils/cx';

const callOutVariants = cva('relative', {
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      lg: '',
      md: '',
      sm: 'px-8! py-6!',
    },
    variant: {
      blue: 'bg-[linear-gradient(0deg,var(--border-action-high-blue-france),var(--border-action-high-blue-france))]!',
      default: '',
      error: 'bg-[linear-gradient(0deg,var(--border-action-high-error),var(--border-action-high-error))]!',
      info: 'bg-[linear-gradient(0deg,var(--border-action-high-info),var(--border-action-high-info))]!',
      success: 'bg-[linear-gradient(0deg,var(--border-action-high-success),var(--border-action-high-success))]!',
      warning: 'bg-[linear-gradient(0deg,var(--border-action-high-warning),var(--border-action-high-warning))]!',
    },
    withImage: {
      true: 'pl-28! pr-4!',
    },
  },
});

const titleVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      lg: 'text-2xl!',
      md: 'text-lg!',
      sm: 'text-base!',
    },
  },
});

const textVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      lg: 'text-lg!',
      md: 'text-base!',
      sm: 'text-sm!',
    },
  },
});

export type CallOutProps = VariantProps<typeof callOutVariants> & DSFRCallOutProps & { image?: string };

const CallOut = ({ children, className, variant, size, image, bodyAs, ...props }: CallOutProps) => {
  return (
    <DSFRCallOut
      bodyAs={bodyAs || (typeof children !== 'string' ? 'div' : undefined)}
      classes={{
        button: undefined,
        root: cx(callOutVariants({ size, variant, withImage: !!image }), className),
        text: textVariants({ size }),
        title: titleVariants({ size }),
      }}
      {...props}
    >
      {image && (
        <div className="z-10 w-24 absolute top-0 bottom-0 left-2 [&>img]:w-full flex items-center justify-center">
          <img src={image} alt="" />
        </div>
      )}
      {children}
    </DSFRCallOut>
  );
};

export default CallOut;
