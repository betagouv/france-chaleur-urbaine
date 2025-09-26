import { type SelectProps as DSFRSelectProps } from '@codegouvfr/react-dsfr/SelectNext';
import {
  type AnyFieldApi,
  type FormAsyncValidateOrFn,
  type FormOptions,
  type FormValidateOrFn,
  useForm as useTanStackForm,
  useStore,
} from '@tanstack/react-form';
import { type ComponentType, useEffect, useState } from 'react';
import { type z } from 'zod';

import DsfrCheckbox, { type CheckboxProps as DsfrCheckboxProps } from '@/components/form/dsfr/Checkbox';
import DsfrCheckboxes, { type CheckboxesProps as DsfrCheckboxesProps } from '@/components/form/dsfr/Checkboxes';
import DsfrInput from '@/components/form/dsfr/Input';
import DsfrPasswordInput from '@/components/form/dsfr/PasswordInput';
import DsfrRadio, { type RadioProps as DsfrRadioProps } from '@/components/form/dsfr/Radio';
import DsfrSelect, { type SelectOption as DsfrSelectOption } from '@/components/form/dsfr/Select';
import DsfrSelectCheckboxes, { type SelectCheckboxesProps as DsfrSelectCheckboxesProps } from '@/components/form/dsfr/SelectCheckboxes';
import DsfrTextArea from '@/components/form/dsfr/TextArea';
import Button, { type ButtonProps } from '@/components/ui/Button';
import cx from '@/utils/cx';
import { getSchemaShape } from '@/utils/validation';

type CustomFieldProps<T extends ComponentType<any>> = {
  name: string;
  fieldInputProps?: any;
  label?: string;
  Component: React.ComponentType<Omit<React.ComponentProps<T>, 'value' | 'onChange' | 'state' | 'stateRelatedMessage'>>;
} & Omit<React.ComponentProps<T>, 'value' | 'onChange' | 'state' | 'stateRelatedMessage'>;

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
  const formIsSubmitted = field.form.state.submissionAttempts > 0;
  const fieldIsBlurred = field.state.meta.isBlurred;

  const displayError = (formIsSubmitted || fieldIsBlurred) && allErrors.length;

  return {
    state: displayError ? 'error' : 'default',
    stateRelatedMessage: displayError ? allErrors.join(', ') : undefined,
  };
}

// Overload for Zod schema
function useForm<
  TSchema extends z.ZodType<any>,
  TFormData = z.infer<TSchema>,
  TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TSubmitMeta = unknown,
>(
  options: {
    schema: TSchema;
    onSubmit?: (args: { value: TFormData }) => Promise<unknown> | unknown;
    validators?: Partial<
      Omit<
        FormOptions<
          TFormData,
          TOnMount,
          TOnChange,
          TOnChangeAsync,
          TOnBlur,
          TOnBlurAsync,
          TOnSubmit,
          TOnSubmitAsync,
          TOnDynamic,
          TOnDynamicAsync,
          TOnServer,
          TSubmitMeta
        >['validators'],
        'onChange'
      >
    >;
  } & Omit<
    FormOptions<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >,
    'validators' | 'onSubmit'
  >
): ReturnType<typeof useFormInternal<TFormData>>;

// Original overload for non-Zod schema
function useForm<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TSubmitMeta = unknown,
>(
  options: FormOptions<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  > & {
    schema?: FormValidateOrFn<TFormData>; // pass directly the schema to validate against
  }
): ReturnType<typeof useFormInternal<TFormData>>;

// Implementation
function useForm<TFormData>(options: any): ReturnType<typeof useFormInternal<TFormData>> {
  return useFormInternal<TFormData>(options);
}

function useFormInternal<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TSubmitMeta = unknown,
>(
  options: FormOptions<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  > & {
    schema?: FormValidateOrFn<TFormData>; // pass directly the schema to validate against
  }
) {
  const { schema, onSubmit, validators = {}, ...tanStackConfig } = options;

  // Create a copy of validators with proper typing
  const combinedValidators = { ...validators };

  if (schema) {
    combinedValidators.onChange = schema as TOnChange;
  }

  const form = useTanStackForm({
    ...tanStackConfig,
    validators: combinedValidators,
    onSubmit,
  });

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
            onChange: (e: any) => {
              const value = e.target.value;

              if (nativeInputProps?.type === 'number') {
                // if field is empty, valueAsNumber returns NaN
                return field.handleChange(value === '' ? undefined : e.target.valueAsNumber);
              }

              return field.handleChange(value);
            },
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

  const NumberInput: typeof Input = ({ nativeInputProps, ...props }) => (
    <Input nativeInputProps={{ type: 'number', ...nativeInputProps }} {...props} />
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
    Omit<DSFRSelectProps<Options>, 'nativeSelectProps' | 'state' | 'stateRelatedMessage' | 'onChange'> & {
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

  const Custom = <T extends ComponentType<any>>({
    name,
    fieldInputProps,
    label,
    Component: CustomComponent,
    ...props
  }: CustomFieldProps<T>) => (
    <form.Field
      name={name}
      {...fieldInputProps}
      children={(field) => {
        return (
          <CustomComponent
            value={field.state.value}
            onChange={field.handleChange}
            label={label}
            {...getInputErrorStates(field)}
            {...(props as React.ComponentProps<T>)}
          />
        );
      }}
    />
  );

  const Submit = ({ children, loading, disabled, ...props }: Omit<ButtonProps, 'type'>) => (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => {
        return (
          <Button
            type="submit"
            disabled={typeof disabled !== 'undefined' ? disabled : !canSubmit}
            loading={isSubmitting || loading}
            {...props}
          >
            {children}
          </Button>
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
                <pre className="overflow-auto max-h-40 border border-gray-200 bg-opacity-50 p-0.5">{JSON.stringify(values, null, 2)}</pre>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">Current Errors:</h4>
                <pre className="overflow-auto max-h-40 border border-gray-200 bg-opacity-50 p-0.5">{JSON.stringify(errors, null, 2)}</pre>
              </div>
            </div>
            <h4 className="text-xs font-semibold mb-1">Remaining state:</h4>
            <pre className="overflow-auto max-h-96 border border-gray-200 bg-opacity-50 p-0.5">{JSON.stringify(state, null, 2)}</pre>
          </div>
        )}
      />
    );
  };

  const Form: React.FC<React.FormHTMLAttributes<HTMLFormElement>> = ({ children, onSubmit, ...props }) => (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit?.(e);
        void form.handleSubmit();
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
    useValue,
    Submit,
    Form,
    FormDebug,
    Field: {
      Checkbox,
      Checkboxes,
      Custom,
      EmailInput,
      Input,
      NumberInput,
      PasswordInput,
      PhoneInput,
      Radio,
      Select,
      SelectCheckboxes,
      Textarea,
      UrlInput,
    },
    FieldWrapper: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={cx('fr-fieldset__element', className)} {...props}>
        {children}
      </div>
    ),
    Fieldset: ({ children, className, ...props }: React.HTMLAttributes<HTMLFieldSetElement>) => (
      <fieldset className={cx('fr-fieldset', className)} {...props}>
        {children}
      </fieldset>
    ),
    FieldsetLegend: ({ children, className, ...props }: React.HTMLAttributes<HTMLLegendElement>) => (
      <legend className={cx('ml-2 mb-1w text-sm font-bold uppercase', className)} {...props}>
        {children}
      </legend>
    ),

    // deprecated
    Checkbox,
    Checkboxes,
    EmailInput,
    Input,
    NumberInput,
    PasswordInput,
    PhoneInput,
    Radio,
    Select,
    SelectCheckboxes,
    Textarea,
    UrlInput,
  };
}

export default useForm;
