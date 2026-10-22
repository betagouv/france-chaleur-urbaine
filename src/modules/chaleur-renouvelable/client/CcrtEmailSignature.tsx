import Input from '@codegouvfr/react-dsfr/Input';
import Select, { type SelectProps } from '@codegouvfr/react-dsfr/Select';
import { useState } from 'react';

type CcrtEmailSignatureProps = { value: string; onChange: (value: string) => void; savedSignature: string } & Pick<
  SelectProps,
  'state' | 'stateRelatedMessage'
>;

/**
 * Selects the existing personal signature or allows editing the signature saved for future sends.
 */
export function CcrtEmailSignature({ value, onChange, savedSignature, state, stateRelatedMessage }: CcrtEmailSignatureProps) {
  const [selection, setSelection] = useState(savedSignature ? 'saved' : '');
  return (
    <>
      <Select
        label="Signature"
        state={state}
        stateRelatedMessage={stateRelatedMessage}
        nativeSelectProps={{
          onChange: (event) => {
            setSelection(event.target.value);
            onChange(event.target.value === 'saved' ? savedSignature : '');
          },
          value: selection,
        }}
      >
        <option value="" disabled>
          Sélectionner une signature
        </option>
        {savedSignature && <option value="saved">Ma signature enregistrée</option>}
        <option value="custom">Saisir ou modifier ma signature</option>
      </Select>
      {selection === 'custom' && (
        <Input
          label="Texte de la signature"
          hintText="Sauvegardé pour vos prochains envois"
          textArea
          nativeTextAreaProps={{ maxLength: 2000, onChange: (event) => onChange(event.target.value), rows: 2, value }}
        />
      )}
    </>
  );
}
