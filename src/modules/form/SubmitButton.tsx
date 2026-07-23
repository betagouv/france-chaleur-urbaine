import { useStore } from '@tanstack/react-form';

import Button, { type ButtonProps } from '@/components/ui/Button';

import { useFormContext } from './form-contexts';

export type SubmitButtonProps = Omit<ButtonProps, 'type'>;

/**
 * Submit button bound to the enclosing form: shows a spinner while submitting.
 * Deliberately stays enabled when the form is invalid — clicking it runs the
 * validation and reveals the errors (a11y: never a greyed-out button with no explanation).
 */
export function SubmitButton({ children, loading, ...props }: SubmitButtonProps) {
  const form = useFormContext();
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Button type="submit" loading={isSubmitting || loading} {...props}>
      {children}
    </Button>
  );
}
