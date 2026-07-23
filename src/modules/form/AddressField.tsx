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
 * et autocompletion BAN. Dans un formulaire `useAppForm`, utiliser `AddressSelectField`,
 * qui lie ce composant au champ TanStack (valeur = BANAddressFeature sélectionnée).
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
            })
          ),
          ...nativeInputProps,
        }}
        {...props}
      />
    </FieldWrapper>
  );
}
