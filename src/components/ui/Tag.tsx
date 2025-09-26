import { Tag as DSFRTag, type TagProps as DSFRTagProps } from '@codegouvfr/react-dsfr/Tag';
import { cva, type VariantProps } from 'class-variance-authority';

import cx from '@/utils/cx';

const tagVariants = cva('', {
  variants: {
    variant: {
      default: '',
      success: 'bg-success! text-white! border-success',
      warning: 'bg-warning! text-white! border-warning',
      error: 'bg-error! text-white! border-error',
      info: 'bg-info! text-white! border-info',
    },
    outline: {
      true: '',
      false: '',
    },
    size: {
      sm: '',
      md: '',
      lg: 'text-lg px-3 py-1',
    },
  },
  compoundVariants: [
    // Outline variants
    {
      variant: 'success',
      outline: true,
      class: '[&&]:bg-white! [&&]:text-success! border border-success',
    },
    {
      variant: 'warning',
      outline: true,
      class: '[&&]:bg-white! [&&]:text-warning! border border-warning',
    },
    {
      variant: 'error',
      outline: true,
      class: '[&&]:bg-white! [&&]:text-error! border border-error',
    },
    {
      variant: 'info',
      outline: true,
      class: '[&&]:bg-white! [&&]:text-info! border border-info',
    },
  ],
  defaultVariants: {
    variant: 'default',
    outline: false,
    size: 'md',
  },
});

export type TagProps = VariantProps<typeof tagVariants> &
  Omit<DSFRTagProps, 'small'> & {
    size?: 'sm' | 'md' | 'lg';
    outline?: boolean;
  };

const Tag = ({ children, className, variant, size = 'md', outline = false, as = 'span', ...props }: TagProps) => {
  return (
    <DSFRTag as={as} small={size === 'sm'} className={cx(tagVariants({ variant, size, outline }), className)} {...(props as any)}>
      {children}
    </DSFRTag>
  );
};

export default Tag;
