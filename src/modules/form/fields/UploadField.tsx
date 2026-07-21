import DsfrUpload, { type UploadProps as DsfrUploadProps } from '@/components/form/dsfr/Upload';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

import { useFieldContext } from '../form-contexts';
import { useFieldErrorState } from './useFieldStatus';

export type UploadFieldProps = Omit<DsfrUploadProps, 'state' | 'stateRelatedMessage' | 'nativeInputProps'> & {
  nativeInputProps?: Omit<NonNullable<DsfrUploadProps['nativeInputProps']>, 'onChange' | 'onBlur' | 'type' | 'value'>;
  /** append newly selected files to the current value instead of replacing it */
  append?: boolean;
  /** show a delete button next to each listed file */
  removable?: boolean;
};

/**
 * File input bound to the enclosing TanStack Form field (`File[]` value, DSFR
 * rendering) with the selected files listed below. One-way binding: a file input
 * has no controllable `value`; clearing the selection keeps the previous files.
 */
export function UploadField({ nativeInputProps, append, removable, ...props }: UploadFieldProps) {
  const field = useFieldContext<File[] | undefined>();
  const errorState = useFieldErrorState();
  const files = field.state.value ?? [];

  return (
    <>
      <DsfrUpload
        nativeInputProps={{
          name: field.name,
          onBlur: field.handleBlur,
          onChange: (event) => {
            const selectedFiles = event.target.files;
            if (selectedFiles && selectedFiles.length > 0) {
              field.handleChange(append ? [...files, ...selectedFiles] : [...selectedFiles]);
            }
          },
          ...nativeInputProps,
        }}
        {...errorState}
        {...props}
      />
      {files.length > 0 && (
        <div className="mb-2w">
          Fichier(s) sélectionné(s) :{' '}
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`}>
              - {file.name}
              {removable && (
                <Button
                  size="small"
                  className="fr-btn--tertiary-no-outline"
                  title="Supprimer le fichier"
                  onClick={() => field.handleChange(files.filter((_, fileIndex) => fileIndex !== index))}
                >
                  <Icon name="ri-delete-bin-2-line" color="var(--text-default-error)" size="lg" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
