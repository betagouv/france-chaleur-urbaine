import type { BANAddressFeature } from '@/modules/ban/types';

import { AddressField, type AddressFieldProps } from '../AddressField';
import { useFieldContext } from '../form-contexts';
import { useFieldErrorState } from './useFieldStatus';

export type AddressSelectFieldProps = Omit<AddressFieldProps, 'state' | 'stateRelatedMessage'>;

/**
 * BAN address autocomplete bound to the enclosing TanStack Form field: the field
 * value is the selected `BANAddressFeature` (`undefined` while none is picked).
 * The input text itself stays uncontrolled (`defaultValue`); `onSelect`/`onClear`
 * still fire for caller side effects.
 */
export function AddressSelectField({ onSelect, onClear, ...props }: AddressSelectFieldProps) {
  const field = useFieldContext<BANAddressFeature | undefined>();
  const errorState = useFieldErrorState();

  return (
    <AddressField
      {...errorState}
      onSelect={(address) => {
        field.handleChange(address);
        onSelect?.(address);
      }}
      onClear={() => {
        field.handleChange(undefined);
        onClear?.();
      }}
      {...props}
    />
  );
}
