import { type SelectProps as DSFRSelectProps } from '@codegouvfr/react-dsfr/SelectNext';
import {
  useForm as useTanStackForm,
  type FormOptions,
  type FormValidateOrFn,
  type FormAsyncValidateOrFn,
  type AnyFieldApi,
  useStore,
} from '@tanstack/react-form';
import { useEffect } from 'react';
import { useState } from 'react';

import DsfrCheckbox, { type CheckboxProps as DsfrCheckboxProps } from '@/components/form/dsfr/Checkbox';
import DsfrCheckboxes, { type CheckboxesProps as DsfrCheckboxesProps } from '@/components/form/dsfr/Checkboxes';
import DsfrInput from '@/components/form/dsfr/Input';
import DsfrPasswordInput from '@/components/form/dsfr/PasswordInput';
import DsfrRadio, { type RadioProps as DsfrRadioProps } from '@/components/form/dsfr/Radio';
import DsfrSelect, { type SelectOption as DsfrSelectOption } from '@/components/form/dsfr/Select';
import DsfrSelectCheckboxes, { type SelectCheckboxesProps as DsfrSelectCheckboxesProps } from '@/components/form/dsfr/SelectCheckboxes';
import DsfrTextArea from '@/components/form/dsfr/TextArea';
import Button, { type ButtonProps } from '@/components/ui/Button';
import { getSchemaShape } from '@/utils/validation';

/**
 * Get the error states for an input field.
 */
export function getAllErrors(field: AnyFieldApi): string[] {
  return [
    ...new Set(
      [
        ...(field.state.meta.errors.length ? field.state.meta.errors.map((e) => e?.message) : []),
        ...(field.state.meta.errorMap?.onChange?.length ? field.state.meta.errorMap.onChange.map((e: any) => e?.message) : []),
      ].filter(Boolean)
    ),
  ];
}

export function getInputErrorStates(field: AnyFieldApi): {
  state?: 'success' | 'error' | 'info' | 'default';
  stateRelatedMessage?: React.ReactNode;
} {
  const allErrors = getAllErrors(field);

  return {
    state: field.state.meta.isTouched && allErrors.length ? 'error' : 'default',
    stateRelatedMessage: field.state.meta.isTouched && allErrors.length ? allErrors.join(', ') : undefined,
  };
}

type UseFormProps<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta,
> = FormOptions<
  TFormData,
  TOnMount,
  TOnChange,
  TOnChangeAsync,
  TOnBlur,
  TOnBlurAsync,
  TOnSubmit,
  TOnSubmitAsync,
  TOnServer,
  TSubmitMeta
> & {
  schema?: TOnChange; // pass directly the schema to validate against
};

function useForm<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta,
>(
  options: UseFormProps<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnServer,
    TSubmitMeta
  >
) {
  const { schema, onSubmit, validators = {}, ...tanStackConfig } = options;

  const formConfig: FormOptions<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnServer,
    TSubmitMeta
  > = {
    ...tanStackConfig,
    ...(schema
      ? {
          validators: { onChange: schema, ...validators }, // Use passed validators if provided, else fallback to schema
        }
      : {
          validators,
        }),
    onSubmit,
  };

  const form = useTanStackForm(formConfig);

  type OriginalFieldProps = React.ComponentProps<typeof form.Field>;

  type FieldProps = { name: OriginalFieldProps['name'] } & { fieldInputProps?: Omit<OriginalFieldProps, 'children' | 'name'> };

  const schemaShape = getSchemaShape(schema as any);

  const isRequiredField = (fieldname: keyof TFormData) => {
    const field = (schemaShape as any)?.[fieldname];
    return !field?.isOptional?.();
  };

  const Input = ({
    name,
    fieldInputProps,
    label,
    nativeInputProps,
    ...props
  }: FieldProps & Omit<React.ComponentProps<typeof DsfrInput>, 'stateRelatedMessage' | 'state'>) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrInput
          label={label}
          nativeInputProps={{
            required: isRequiredField(name as keyof TFormData),
            id: nativeInputProps?.id || `${name}`,
            name: nativeInputProps?.name || `${name}`,
            value: field.state.value as any,
            onChange: (e: any) => field.handleChange(e.target.value as any),
            onBlur: field.handleBlur,
            ...nativeInputProps,
          }}
          {...getInputErrorStates(field)}
          {...props}
        />
      )}
    />
  );

  const Textarea = ({
    name,
    fieldInputProps,
    label,
    nativeTextAreaProps,
    ...props
  }: FieldProps & Omit<React.ComponentProps<typeof DsfrTextArea>, 'stateRelatedMessage' | 'state'>) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrTextArea
          label={label}
          nativeTextAreaProps={{
            required: isRequiredField(name as keyof TFormData),
            id: nativeTextAreaProps?.id || `${name}`,
            name: nativeTextAreaProps?.name || `${name}`,
            value: field.state.value as any,
            onChange: (e: any) => field.handleChange(e.target.value as any),
            onBlur: field.handleBlur,
            ...nativeTextAreaProps,
          }}
          {...getInputErrorStates(field)}
          {...props}
        />
      )}
    />
  );

  const PasswordInput = ({
    name,
    fieldInputProps,
    label,
    nativeInputProps,
    ...props
  }: FieldProps & Omit<React.ComponentProps<typeof DsfrInput>, 'stateRelatedMessage' | 'state'>) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrPasswordInput
          label={label}
          nativeInputProps={{
            required: isRequiredField(name as keyof TFormData),
            type: 'password',
            autoComplete: 'password',
            id: nativeInputProps?.id || `${name}`,
            name: nativeInputProps?.name || `${name}`,
            value: field.state.value as any,
            onChange: (e: any) => field.handleChange(e.target.value as any),
            onBlur: field.handleBlur,
            ...nativeInputProps,
          }}
          messages={
            field.state.meta.isTouched
              ? getAllErrors(field).map((e) => ({
                  message: e,
                  severity: 'error',
                }))
              : []
          }
          {...props}
        />
      )}
    />
  );

  const EmailInput: typeof Input = ({ nativeInputProps, ...props }) => (
    <Input nativeInputProps={{ type: 'email', autoComplete: 'email', ...nativeInputProps }} {...props} />
  );

  const PhoneInput: typeof Input = ({ nativeInputProps, ...props }) => (
    <Input
      nativeInputProps={{
        type: 'tel',
        autoComplete: 'tel',
        placeholder: '0123456789',
        ...nativeInputProps,
      }}
      {...props}
    />
  );
  const UrlInput: typeof Input = ({ nativeInputProps, iconId = 'fr-icon-link', ...props }) => (
    <Input nativeInputProps={{ type: 'url', autoComplete: 'url', ...nativeInputProps }} iconId={iconId} {...props} />
  );

  const Checkbox = ({
    name,
    fieldInputProps,
    label,
    nativeInputProps,
    ...props
  }: FieldProps &
    Omit<DsfrCheckboxProps, 'stateRelatedMessage' | 'state' | 'name' /* Because name on Checkbox is of type never in DSFR */>) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrCheckbox
          small
          label={label}
          nativeInputProps={{
            name: nativeInputProps?.name || `${name}`,
            onChange: (e) => field.handleChange(e.target.checked as any),
            checked: field.state.value as any,
            ...nativeInputProps,
          }}
          {...getInputErrorStates(field)}
          {...props}
        />
      )}
    />
  );

  const Checkboxes = ({
    name,
    fieldInputProps,
    label,
    options,
    ...props
  }: FieldProps &
    Omit<DsfrCheckboxesProps, 'stateRelatedMessage' | 'state' | 'options' | 'name'> & {
      options: (Omit<DsfrCheckboxesProps['options'][number], 'nativeInputProps'> & {
        nativeInputProps?: Omit<DsfrCheckboxesProps['options'][number]['nativeInputProps'], 'checked' | 'onChange' | 'onBlur'>;
      })[];
    }) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrCheckboxes
          small
          label={label}
          options={options.map((option) => ({
            ...option,
            nativeInputProps: {
              name: `${name}`,
              onChange: (e) => {
                const value = (field.state.value as string[]) || [];

                const optionValue = option.nativeInputProps?.value || option.label;
                if (e.target.checked) {
                  field.handleChange([...value, optionValue] as any);
                } else {
                  field.handleChange(value.filter((v) => v !== optionValue) as any);
                }
              },
              checked: Array.isArray(field.state.value) && field.state.value.includes(option.nativeInputProps?.value || option.label),
              ...option.nativeInputProps,
            },
          }))}
          {...getInputErrorStates(field)}
          {...props}
        />
      )}
    />
  );

  const SelectCheckboxes = ({
    name,
    fieldInputProps,
    label,
    options,
    ...props
  }: FieldProps &
    Omit<DsfrSelectCheckboxesProps, 'stateRelatedMessage' | 'state' | 'options' | 'fieldId'> & {
      options: (Omit<DsfrSelectCheckboxesProps['options'][number], 'nativeInputProps'> & {
        nativeInputProps?: Omit<DsfrSelectCheckboxesProps['options'][number]['nativeInputProps'], 'checked' | 'onChange' | 'onBlur'>;
      })[];
    }) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrSelectCheckboxes
          fieldId={name}
          label={label}
          options={options.map((option) => ({
            ...option,
            nativeInputProps: {
              name: `${name}`,
              onChange: (e) => {
                const value = (field.state.value as string[]) || [];

                const optionValue = option.nativeInputProps?.value || option.label;
                if (e.target.checked) {
                  field.handleChange([...value, optionValue] as any);
                } else {
                  field.handleChange(value.filter((v) => v !== optionValue) as any);
                }
              },
              checked: Array.isArray(field.state.value) && field.state.value.includes(option.nativeInputProps?.value || option.label),
              ...option.nativeInputProps,
            },
          }))}
          {...getInputErrorStates(field)}
          {...props}
        />
      )}
    />
  );

  const Select = <Options extends DsfrSelectOption[]>({
    name,
    fieldInputProps,
    options,
    label,
    nativeSelectProps,
    ...props
  }: FieldProps &
    Omit<DSFRSelectProps<Options>, 'nativeSelectProps' | 'state' | 'stateRelatedMessage'> & {
      nativeSelectProps?: Omit<DSFRSelectProps<Options>['nativeSelectProps'], 'value' | 'onChange' | 'onBlur'>;
    }) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrSelect<Options>
          label={label}
          options={options}
          nativeSelectProps={{
            id: `${name}`,
            name: `${name}`,
            required: isRequiredField(name as keyof TFormData),
            value: field.state.value as any,
            onChange: (e) => field.handleChange(e.target.value as any),
            onBlur: field.handleBlur,
            ...nativeSelectProps,
          }}
          {...getInputErrorStates(field)}
          {...props}
        />
      )}
    />
  );

  const Radio = ({
    name,
    fieldInputProps,
    options,
    label,
    orientation,
    ...props
  }: FieldProps & Omit<DsfrRadioProps, 'state' | 'stateRelatedMessage'>) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => (
        <DsfrRadio
          label={label}
          orientation={orientation}
          options={options.map((option) => ({
            ...option,
            nativeInputProps: {
              ...option.nativeInputProps,
              required: isRequiredField(name as keyof TFormData),
              checked: field.state.value && field.state.value === option.nativeInputProps.value,
              onChange: (e) => field.handleChange(e.target.value as any),
              onBlur: field.handleBlur,
            },
          }))}
          {...getInputErrorStates(field)}
          {...props}
        />
      )}
    />
  );

  const Submit = ({ children, ...props }: Omit<ButtonProps, 'type' | 'disabled' | 'loading'>) => (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => {
        const ButtonWorkingWithTypescript = Button as any;
        return (
          <ButtonWorkingWithTypescript type="submit" disabled={!canSubmit} loading={isSubmitting} {...props}>
            {children}
          </ButtonWorkingWithTypescript>
        );
      }}
    />
  );

  const FormDebug = () => {
    // Only show form debug when pressing Ctrl+Shift+D
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          setShowDebug((prev) => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!showDebug) return null;
    return (
      <form.Subscribe
        selector={(state) => state}
        children={({ values, errors, ...state }) => (
          <div className="bg-gray-100 p-4 my-4 rounded-md text-xs ">
            <h3 className="text-sm font-bold mb-2">Form Debug</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold mb-1">Current Values:</h4>
                <pre className="overflow-auto max-h-40">{JSON.stringify(values, null, 2)}</pre>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">Current Errors:</h4>
                <pre className="overflow-auto max-h-40">{JSON.stringify(errors, null, 2)}</pre>
              </div>
            </div>
            <h4 className="text-xs font-semibold mb-1">Remaining state:</h4>
            <pre>{JSON.stringify(state, null, 2)}</pre>
          </div>
        )}
      />
    );
  };

  const Form: React.FC<React.FormHTMLAttributes<HTMLFormElement>> = ({ children, onSubmit, ...props }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit?.(e);
        form.handleSubmit();
      }}
      {...props}
    >
      {children}
      <FormDebug />
    </form>
  );

  const useValue = <T,>(fieldName: keyof TFormData) => useStore(form.store, (state) => state.values[fieldName] as T);

  return {
    form,
    Input,
    PasswordInput,
    EmailInput,
    Textarea,
    UrlInput,
    Checkbox,
    PhoneInput,
    Submit,
    Form,
    FormDebug,
    Select,
    Radio,
    Checkboxes,
    SelectCheckboxes,
    useValue,
  };
}

export default useForm;
