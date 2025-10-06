import { Tag as DSFRTag, type TagProps as DSFRTagProps } from '@codegouvfr/react-dsfr/Tag';
import { cva, type VariantProps } from 'class-variance-authority';

import cx from '@/utils/cx';

const tagVariants = cva('', {
  compoundVariants: [
    // Outline variants
    {
      class: '[&&]:bg-white! [&&]:text-success! border border-success',
      outline: true,
      variant: 'success',
    },
    {
      class: '[&&]:bg-white! [&&]:text-warning! border border-warning',
      outline: true,
      variant: 'warning',
    },
    {
      class: '[&&]:bg-white! [&&]:text-error! border border-error',
      outline: true,
      variant: 'error',
    },
    {
      class: '[&&]:bg-white! [&&]:text-info! border border-info',
      outline: true,
      variant: 'info',
    },
  ],
  defaultVariants: {
    outline: false,
    size: 'md',
    variant: 'default',
  },
  variants: {
    outline: {
      false: '',
      true: '',
    },
    size: {
      lg: 'text-lg px-3 py-1',
      md: '',
      sm: '',
    },
    variant: {
      default: '',
      error: 'bg-error! text-white! border-error',
      info: 'bg-info! text-white! border-info',
      success: 'bg-success! text-white! border-success',
      warning: 'bg-warning! text-white! border-warning',
    },
  },
});

export type TagProps = VariantProps<typeof tagVariants> &
  Omit<DSFRTagProps, 'small'> & {
    size?: 'sm' | 'md' | 'lg';
    outline?: boolean;
  };

const Tag = ({ children, className, variant, size = 'md', outline = false, as = 'span', ...props }: TagProps) => {
  return (
    <DSFRTag as={as} small={size === 'sm'} className={cx(tagVariants({ outline, size, variant }), className)} {...(props as any)}>
      {children}
    </DSFRTag>
  );
};

export default Tag;
