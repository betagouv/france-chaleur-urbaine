import DsfrSelect, { type SelectProps as DsfrSelectProps, type SelectOption } from '@/components/form/dsfr/Select';

import { useFieldContext } from '../form-contexts';
import { useFieldErrorState, useFieldIsRequired } from './useFieldStatus';

export type SelectFieldProps<Options extends SelectOption[]> = Omit<
  DsfrSelectProps<Options>,
  'state' | 'stateRelatedMessage' | 'nativeSelectProps'
> & {
  hideOptionalLabel?: boolean;
  nativeSelectProps?: Omit<NonNullable<DsfrSelectProps<Options>['nativeSelectProps']>, 'value' | 'onChange' | 'onBlur'>;
};

/**
 * Select bound to the enclosing TanStack Form field (DSFR SelectNext rendering).
 * Value, error display and the required marker — "(Optionnel)" label suffix, like
 * the DSFR Input wrapper — are driven by the form state and schema; a
 * `nativeSelectProps.required` override wins over the schema derivation.
 * For side effects on change, use `listeners={{ onChange }}` on the `form.AppField`.
 */
export function SelectField<Options extends SelectOption[]>({
  hideOptionalLabel,
  label,
  nativeSelectProps,
  ...props
}: SelectFieldProps<Options>) {
  const field = useFieldContext<string | undefined>();
  const errorState = useFieldErrorState();
  const schemaRequired = useFieldIsRequired();
  const isRequired = nativeSelectProps?.required ?? schemaRequired;

  return (
    <DsfrSelect<Options>
      label={
        label && !hideOptionalLabel && !isRequired ? (
          <>
            {label}
            <small> (Optionnel)</small>
          </>
        ) : (
          label
        )
      }
      nativeSelectProps={{
        name: field.name,
        onBlur: field.handleBlur,
        onChange: (event) => field.handleChange(event.target.value),
        required: isRequired,
        value: field.state.value,
        ...nativeSelectProps,
      }}
      {...errorState}
      {...props}
    />
  );
}
