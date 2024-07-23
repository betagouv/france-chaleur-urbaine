import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import {
  FormProvider,
  useForm as useFormReactHookForm,
  type FieldValues,
  type SubmitHandler,
  type UseFormProps,
} from 'react-hook-form';
import Input from './Input';
import Radio from './Radio';
import Select from './Select';
import TextArea from './TextArea';
import Toggle from './Toggle';

export { z } from 'zod';

export const useForm = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
>(
  props: UseFormProps<TFieldValues, TContext> & {
    schema?: Parameters<typeof zodResolver> | Parameters<typeof zodResolver>[0];
  }
) => {
  if (props?.schema && !props.resolver) {
    if (Array.isArray(props.schema)) {
      props.resolver = zodResolver(...props.schema);
    } else {
      props.resolver = zodResolver(props.schema);
    }
  }

  const methods = useFormReactHookForm(props);

  const Form: React.FC<
    Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
      onSubmit: SubmitHandler<TFieldValues>;
    }
  > = React.useCallback(
    ({ onSubmit, children, className, ...rest }) => {
      return (
        // Wrap all forms with the FormProvider to allow using useController in inputs
        <FormProvider {...methods}>
          <form
            className={className}
            onSubmit={methods.handleSubmit(onSubmit)}
            {...rest}
          >
            {children}
          </form>
        </FormProvider>
      );
    },
    [methods]
  );
  return {
    ...methods,
    Form,
    TextArea: TextArea<TFieldValues>,
    Input: Input<TFieldValues>,
    Radio: Radio<TFieldValues>,
    Toggle: Toggle<TFieldValues>,
    Select: Select<TFieldValues>,
  };
};
