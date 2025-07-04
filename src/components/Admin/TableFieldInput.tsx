import React, { type ChangeEvent, forwardRef, useCallback, useMemo, useState } from 'react';

import { type InputProps } from '@/components/form/dsfr/Input';
import { Input } from '@/components/form/dsfr/Input.styles';
import debounce from '@/utils/debounce';

export type TableFieldInputProps = {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  debounceMs?: number;
} & Omit<InputProps, 'label'>;

const TableFieldInput = forwardRef<HTMLInputElement, TableFieldInputProps>(
  ({ value: valueExternal, onChange: onChangeExternal, title, debounceMs = 500, nativeInputProps, ...props }, ref) => {
    const [value, setValue] = useState(valueExternal);

    const debouncedUpdateDemand = useMemo(() => debounce((value: string) => onChangeExternal(value), debounceMs), [onChangeExternal]);

    const onChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue(value);
        debouncedUpdateDemand(value);
      },
      [debouncedUpdateDemand]
    );

    return (
      <Input
        ref={ref}
        $size="sm"
        label=""
        {...props}
        nativeInputProps={{
          value,
          onChange,
          title,
          ...nativeInputProps,
        }}
      />
    );
  }
);

TableFieldInput.displayName = 'TableFieldInput';

export default TableFieldInput;
