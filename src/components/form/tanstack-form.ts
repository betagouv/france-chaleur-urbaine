import { type UploadProps } from '@codegouvfr/react-dsfr/Upload';
import { type FieldApi } from '@tanstack/react-form';

/**
 * Get the error states for an input field.
 */
export function getInputErrorStates(field: FieldApi<any, any, any, any, any>): Pick<UploadProps, 'state' | 'stateRelatedMessage'> {
  return {
    state: field.state.meta.isTouched && field.state.meta.errors.length ? 'error' : 'default',
    stateRelatedMessage: field.state.meta.isTouched && field.state.meta.errors.length ? field.state.meta.errors.join(', ') : undefined,
  };
}
