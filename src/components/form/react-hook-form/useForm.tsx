import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedEffect, usePrevious } from '@react-hookz/web';
import React from 'react';
import {
  FormProvider,
  useForm as useFormReactHookForm,
  useWatch,
  type DeepPartialSkipArrayKey,
  type FieldValues,
  type SubmitHandler,
  type UseFormProps,
} from 'react-hook-form';

import { getChanges } from '@utils/objects';

import Checkboxes from './Checkboxes';
import Input from './Input';
import Radio from './Radio';
import Select from './Select';
import TextArea from './TextArea';
import Toggle from './Toggle';

export { z } from 'zod';

interface UseFormOnChangeData<T extends FieldValues> {
  values: DeepPartialSkipArrayKey<T>;
  changed?: ReturnType<typeof getChanges>;
  isDirty: boolean;
  isValid: boolean;
}

type UseFormOnChange<T extends FieldValues> = (callback: UseFormOnChangeData<T>) => any;

export const useForm = <TFieldValues extends FieldValues = FieldValues, TContext = any>({
  schema,
  onChange,
  ...props
}: UseFormProps<TFieldValues, TContext> & {
  schema?: Parameters<typeof zodResolver> | Parameters<typeof zodResolver>[0];
  onChange?: UseFormOnChange<TFieldValues>;
}) => {
  if (schema && !props.resolver) {
    if (Array.isArray(schema)) {
      props.resolver = zodResolver(...schema);
    } else {
      props.resolver = zodResolver(schema);
    }
  }

  const methods = useFormReactHookForm(props);

  const submitValues = useWatch({ control: methods.control });
  const previousSubmitValues = usePrevious(submitValues);
  const isDirty = methods.formState.isDirty;
  const isValid = methods.formState.isValid;

  const Form: React.FC<
    Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
      onSubmit: SubmitHandler<TFieldValues>;
    }
  > = React.useCallback(
    ({ onSubmit, children, className, ...rest }) => {
      return (
        // Wrap all forms with the FormProvider to allow using useController in inputs
        <FormProvider {...methods}>
          <form className={className} onSubmit={methods.handleSubmit(onSubmit)} {...rest}>
            {children}
          </form>
        </FormProvider>
      );
    },
    [methods]
  );

  // Send onChange callback on every field change
  useDebouncedEffect(
    () =>
      onChange?.({
        values: submitValues,
        changed: !previousSubmitValues ? [] : getChanges(submitValues, previousSubmitValues),
        isDirty,
        isValid,
      }),
    [submitValues, isDirty, isValid],
    500
  );

  return {
    ...methods,
    Form,
    TextArea: TextArea<TFieldValues>,
    Input: Input<TFieldValues>,
    Radio: Radio<TFieldValues>,
    Toggle: Toggle<TFieldValues>,
    Select: Select<TFieldValues>,
    Checkboxes: Checkboxes<TFieldValues>,
  };
};
