import React, { type ChangeEvent, forwardRef, useCallback, useMemo, useState } from 'react';

import { type InputProps } from '@/components/form/dsfr/Input';
import { Input } from '@/components/form/dsfr/Input.styles';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import { defaultEmptyNumberValue, defaultEmptyStringValue } from '@/utils/airtable';
import { isDefined } from '@/utils/core';
import debounce from '@/utils/debounce';
import { stopPropagation } from '@/utils/events';

export type TableFieldInputProps = Omit<InputProps, 'label'> & {
  title?: string;
  debounceMs?: number;
} & (
    | {
        type: 'number';
        value: number | null | undefined;
        onChange: (value: number | undefined) => void;
        suggestedValue?: number;
      }
    | {
        type?: 'text';
        value: string | null | undefined;
        onChange: (value: string | undefined) => void;
        suggestedValue?: string;
      }
  );

const TableFieldInput = forwardRef<HTMLInputElement, TableFieldInputProps>((rawProps, ref) => {
  const props = { type: 'text', ...rawProps } satisfies TableFieldInputProps;
  const { value: valueExternal, onChange: onChangeExternal, title, debounceMs = 500, nativeInputProps, type, ...restProps } = props;

  const defaultEmptyValue = props.type === 'number' ? defaultEmptyNumberValue : defaultEmptyStringValue;
  const [value, setValue] = useState(valueExternal === defaultEmptyValue ? props.suggestedValue : valueExternal);

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

  const resetValue = useCallback(() => {
    setValue(props.suggestedValue);
    (onChangeExternal as any)(defaultEmptyValue);
  }, [onChangeExternal, props.type]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
      nativeInputProps?.onClick?.(e);
    },
    [nativeInputProps?.onClick]
  );

  const inputElement = (
    <Input
      className="w-full"
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
        onClick,
        onDoubleClick: stopPropagation,
      }}
    />
  );

  return isDefined(props.suggestedValue) ? (
    <div className="block relative w-full" onClick={stopPropagation} onDoubleClick={stopPropagation}>
      <div className="absolute top-0.5 right-0.5 z-10 flex gap-1">
        {/* visual indicator that the value is suggested */}
        {valueExternal === defaultEmptyValue ? (
          <Tooltip title="Valeur suggérée automatiquement">
            <Icon name="fr-icon-sparkling-2-line" size="xs" color="info" className="p-0.5 cursor-help" />
          </Tooltip>
        ) : (
          <Tooltip title={`Revoir la suggestion (${props.suggestedValue})`}>
            <button onClick={resetValue} className="-mt-1 p-0.5 hover:bg-gray-100 rounded">
              <Icon name="fr-icon-refresh-line" size="xs" color="warning" />
            </button>
          </Tooltip>
        )}
      </div>
      {inputElement}
    </div>
  ) : (
    inputElement
  );
});

TableFieldInput.displayName = 'TableFieldInput';

export default TableFieldInput;
