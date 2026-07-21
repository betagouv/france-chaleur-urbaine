import { useRef } from 'react';

export type FormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  form: {
    AppForm: React.ComponentType<React.PropsWithChildren>;
    handleSubmit: () => Promise<void>;
    state: { isValid: boolean };
    validate: (cause: 'submit') => unknown;
  };
};

/**
 * `<form>` wrapper for a `useAppForm` instance: wires submit handling, provides
 * the form context (needed by `form.SubmitButton`), and moves focus to the
 * first invalid field after a failed submit attempt.
 */
export function Form({ form, children, ...formProps }: FormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // refresh every field meta before handleSubmit: its internal isFieldsValid gate
    // reads the existing metas, and a stale one (a branch-switch unmount wipes the
    // metas of the remounted fields, while the others keep theirs) would make it
    // return early without ever re-running the schema
    await form.validate('submit');
    await form.handleSubmit();
    if (!form.state.isValid) {
      focusFirstInvalidField(formRef.current);
    }
  };

  return (
    <form.AppForm>
      <form ref={formRef} noValidate onSubmit={handleSubmit} {...formProps}>
        {children}
      </form>
    </form.AppForm>
  );
}

// DSFR error classes: standalone inputs/selects, fieldset groups (radio/checkbox),
// and FieldWrapper-based fields whose error class is only on the input group
const INVALID_FIELD_SELECTOR =
  '.fr-input--error, .fr-select--error, :is(.fr-fieldset--error, .fr-input-group--error) :is(input, select, textarea)';

const focusFirstInvalidField = (formElement: HTMLFormElement | null) => {
  formElement?.querySelector<HTMLElement>(INVALID_FIELD_SELECTOR)?.focus();
};
