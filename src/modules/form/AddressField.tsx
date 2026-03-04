import { fr } from '@codegouvfr/react-dsfr';
import type React from 'react';
import { useId } from 'react';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import cx from '@/utils/cx';

import { AddressSearch, type AddressSearchProps } from './AddressSearch';

// Explicit FieldWrapper props to avoid type conflicts with HTML event handlers
type FieldProps = {
  fieldId?: string;
  label?: React.ReactNode;
  hintText?: React.ReactNode;
  state?: 'success' | 'error' | 'default' | 'info';
  stateRelatedMessage?: React.ReactNode;
  className?: string;
};

export type AddressFieldProps = Omit<AddressSearchProps, 'id'> & FieldProps;

/**
 * Champ d'adresse tout-en-un pour les formulaires DSFR : label, aide, état d'erreur
 * et autocompletion BAN. Compatible TanStack Form via useForm.Field.Custom.
 *
 * ```tsx
 * <form.Field.Custom
 *   name="address"
 *   Component={AddressField}
 *   label="Adresse"
 *   onSelect={(address) => {
 *     form.setFieldValue('latitude', address.geometry.coordinates[1]);
 *     form.setFieldValue('longitude', address.geometry.coordinates[0]);
 *   }}
 * />
 * ```
 */
export function AddressField({
  fieldId,
  label,
  hintText,
  state,
  stateRelatedMessage,
  className,
  nativeInputProps,
  ...props
}: AddressFieldProps) {
  const generatedId = useId();
  const id = fieldId ?? generatedId;

  return (
    <FieldWrapper
      fieldId={id}
      label={typeof label === 'undefined' ? 'Adresse' : label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <AddressSearch
        id={id}
        nativeInputProps={{
          className: cx(
            fr.cx('fr-input', {
              'fr-input--error': state === 'error',
              'fr-input--valid': state === 'success',
            }),
            // DSFR uses .fr-label + .fr-input selectors which don't apply here
            label !== undefined && 'mt-2'
          ),
          ...nativeInputProps,
        }}
        {...props}
      />
    </FieldWrapper>
  );
}
