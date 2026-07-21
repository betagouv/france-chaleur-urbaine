import type { ComponentType, JSX } from 'react';

import { useFieldContext } from '../form-contexts';
import { useFieldErrorState } from './useFieldStatus';

export type CustomFieldProps<TProps> = Omit<TProps, 'value' | 'onChange' | 'state' | 'stateRelatedMessage'> & {
  Component: ComponentType<TProps>;
};

/**
 * Bridge for arbitrary controlled components (Autocomplete, RichSelect…): injects
 * `value` / `onChange` from the enclosing TanStack Form field plus the DSFR error
 * props (`state` / `stateRelatedMessage`). The component keeps all its other props.
 */
export function CustomField<TProps extends object>({ Component, ...props }: CustomFieldProps<TProps>) {
  const field = useFieldContext();
  const errorState = useFieldErrorState();

  // TS cannot prove Omit<TProps> + the injected props = TProps for an arbitrary component
  const componentProps = {
    ...props,
    onChange: field.handleChange,
    value: field.state.value,
    ...errorState,
  } as unknown as TProps & JSX.IntrinsicAttributes;

  return <Component {...componentProps} />;
}
