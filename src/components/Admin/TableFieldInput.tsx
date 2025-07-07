import React, { type ChangeEvent, forwardRef, useCallback, useMemo, useState } from 'react';

import { type InputProps } from '@/components/form/dsfr/Input';
import { Input } from '@/components/form/dsfr/Input.styles';
import debounce from '@/utils/debounce';

export type TableFieldInputProps = Omit<InputProps, 'label'> & {
  title?: string;
  debounceMs?: number;
} & (
    | {
        type: 'number';
        value: number | null;
        onChange: (value: number | null) => void;
      }
    | {
        type?: 'text';
        value: string | null;
        onChange: (value: string | null) => void;
      }
  );

const TableFieldInput = forwardRef<HTMLInputElement, TableFieldInputProps>((rawProps, ref) => {
  const props = { type: 'text', ...rawProps } satisfies TableFieldInputProps;
  const { value: valueExternal, onChange: onChangeExternal, title, debounceMs = 500, nativeInputProps, type, ...restProps } = props;
  const [value, setValue] = useState(valueExternal);

  const debouncedUpdateDemand = useMemo(
    () => debounce((value: string | number) => (onChangeExternal as any)(value), debounceMs),
    [onChangeExternal]
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const typedValue = type === 'number' ? parseInt(value) : value;
      setValue(typedValue);
      debouncedUpdateDemand(typedValue);
    },
    [debouncedUpdateDemand]
  );

  return (
    <Input
      ref={ref}
      $size="sm"
      label=""
      {...restProps}
      nativeInputProps={{
        value: value ?? undefined,
        onChange,
        title,
        type,
        ...nativeInputProps,
      }}
    />
  );
});

TableFieldInput.displayName = 'TableFieldInput';

export default TableFieldInput;
