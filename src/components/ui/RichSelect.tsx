import * as Select from '@radix-ui/react-select';
import Image from 'next/image';
import { useId } from 'react';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import cx from '@/utils/cx';

export type RichSelectOption<T extends string = string> = {
  value: T;
  label: string;
  icone?: string;
  description?: string;
};

type RichSelectProps<T extends string = string> = {
  value?: T;
  onChange: (value: T) => void;
  options: RichSelectOption<T>[];
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
};

export default function RichSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner une option',
  className,
  label,
  disabled = false,
}: RichSelectProps<T>) {
  const id = useId();

  const radixValue = value ?? '';

  return (
    <FieldWrapper fieldId={id} label={label || ''} className={className}>
      <Select.Root
        value={radixValue}
        disabled={disabled}
        onValueChange={(v) => {
          if (v) onChange(v as T);
        }}
      >
        <Select.Trigger
          className={cx(
            'fr-select w-full data-disabled:cursor-not-allowed data-disabled:bg-gray-100 data-disabled:text-gray-500',
            className
          )}
        >
          <span className="block truncate whitespace-nowrap overflow-hidden text-left">
            <Select.Value placeholder={<span className="block truncate whitespace-nowrap overflow-hidden">{placeholder}</span>} />
          </span>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-white shadow-lg" position="popper">
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cx('cursor-pointer select-none px-4 py-3 outline-none', 'data-highlighted:bg-blue-50')}
                >
                  <Select.ItemText>
                    <div className="flex">
                      {option.icone && <Image src={option.icone} alt="icone" width="16" height="16" className="mr-1" />}
                      <span>{option.label}</span>
                    </div>
                  </Select.ItemText>
                  {option.description && <div className="text-xs text-slate-500">{option.description}</div>}
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </FieldWrapper>
  );
}
