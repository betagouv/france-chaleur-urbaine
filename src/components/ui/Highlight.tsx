import { Highlight as DSFRHighlight, type HighlightProps as DSFRHighlightProps } from '@codegouvfr/react-dsfr/Highlight';
import { cva, type VariantProps } from 'class-variance-authority';

const highlightVariants = cva('', {
  variants: {
    variant: {
      default: '',
      blue: 'bg-[linear-gradient(0deg,var(--border-action-high-blue-france),var(--border-action-high-blue-france))]!',
      info: 'bg-[linear-gradient(0deg,var(--border-action-high-info),var(--border-action-high-info))]!',
      success: 'bg-[linear-gradient(0deg,var(--border-action-high-success),var(--border-action-high-success))]!',
      warning: 'bg-[linear-gradient(0deg,var(--border-action-high-warning),var(--border-action-high-warning))]!',
      error: 'bg-[linear-gradient(0deg,var(--border-action-high-error),var(--border-action-high-error))]!',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type HighlightProps = VariantProps<typeof highlightVariants> & DSFRHighlightProps;

const Highlight = ({ children, className, variant, size }: HighlightProps) => {
  return (
    <DSFRHighlight
      size={size}
      classes={{
        root: highlightVariants({ variant, className }),
      }}
    >
      {children}
    </DSFRHighlight>
  );
};

export default Highlight;
