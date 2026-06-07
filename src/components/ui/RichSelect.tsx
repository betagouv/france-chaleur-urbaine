import Image from 'next/image';
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { PostHogEvent, PostHogEventMap } from '@/modules/analytics/posthog.config';
import cx from '@/utils/cx';

export type RichSelectOption<T extends string = string> = {
  value: T;
  label: string;
  icone?: string;
  description?: string;
};

type ValuePostHogTrackingProps<Value, Event extends PostHogEvent = PostHogEvent> = {
  postHogEventKey?: Event;
} & ([PostHogEventMap[Event]] extends [never]
  ? { postHogEventProps?: never }
  : { postHogEventProps?: PostHogEventMap[Event] | ((value: Value) => PostHogEventMap[Event]) });

function getPostHogEventProps<Value, Event extends PostHogEvent>(
  postHogEventProps: ValuePostHogTrackingProps<Value, Event>['postHogEventProps'],
  value: Value
) {
  return typeof postHogEventProps === 'function' ? postHogEventProps(value) : postHogEventProps;
}

type RichSelectProps<T extends string = string, Event extends PostHogEvent = PostHogEvent> = {
  value?: T;
  onChange: (value: T) => void;
  options: RichSelectOption<T>[];
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
} & ValuePostHogTrackingProps<T, Event>;

export default function RichSelect<T extends string, Event extends PostHogEvent = PostHogEvent>({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner une option',
  className,
  label,
  disabled = false,
  postHogEventKey,
  postHogEventProps,
}: RichSelectProps<T, Event>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);

  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const selectedOptionIndex = useMemo(() => options.findIndex((option) => option.value === value), [options, value]);
  const activeOption = options[activeOptionIndex];

  const openSelect = useCallback(() => {
    if (disabled) {
      return;
    }

    setActiveOptionIndex(getInitialActiveOptionIndex(selectedOptionIndex, options.length));
    setIsOpen(true);
  }, [disabled, options.length, selectedOptionIndex]);

  const closeSelect = useCallback(() => {
    setIsOpen(false);
  }, []);

  const selectOption = useCallback(
    (nextValue: T) => {
      if (nextValue !== value) {
        onChange(nextValue);
        trackPostHogEvent(postHogEventKey, getPostHogEventProps(postHogEventProps, nextValue));
      }

      closeSelect();
    },
    [closeSelect, onChange, postHogEventKey, postHogEventProps, value]
  );

  const moveActiveOption = useCallback(
    (offset: number) => {
      setActiveOptionIndex((currentActiveOptionIndex) => getNextActiveOptionIndex(currentActiveOptionIndex, offset, options.length));
    },
    [options.length]
  );

  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      closeSelect();
      return;
    }

    openSelect();
  }, [closeSelect, isOpen, openSelect]);

  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (isOpen) {
          moveActiveOption(1);
          return;
        }

        openSelect();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (isOpen) {
          moveActiveOption(-1);
          return;
        }

        openSelect();
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setActiveOptionIndex(getInitialActiveOptionIndex(-1, options.length));
        setIsOpen(true);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setActiveOptionIndex(options.length - 1);
        setIsOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeSelect();
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();

        if (!isOpen) {
          openSelect();
          return;
        }

        if (activeOption) {
          selectOption(activeOption.value);
        }
      }
    },
    [activeOption, closeSelect, disabled, isOpen, moveActiveOption, openSelect, options.length, selectOption]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        closeSelect();
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [closeSelect, isOpen]);

  return (
    <div ref={containerRef}>
      <FieldWrapper label={label || ''} className={className}>
        <div className="relative">
          <button
            type="button"
            className="fr-select w-full cursor-pointer text-left disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            disabled={disabled}
            role="combobox"
            onClick={handleTriggerClick}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className="block truncate overflow-hidden whitespace-nowrap text-left">{selectedOption?.label ?? placeholder}</span>
          </button>

          {isOpen && (
            <RichSelectOptionList activeOptionIndex={activeOptionIndex} onSelect={selectOption} options={options} selectedValue={value} />
          )}
        </div>
      </FieldWrapper>
    </div>
  );
}

type RichSelectOptionListProps<T extends string> = {
  activeOptionIndex: number;
  onSelect: (value: T) => void;
  options: RichSelectOption<T>[];
  selectedValue?: T;
};

function RichSelectOptionList<T extends string>({ activeOptionIndex, onSelect, options, selectedValue }: RichSelectOptionListProps<T>) {
  return (
    <ul
      className="absolute top-full left-0 z-50 mt-1 max-h-64 min-w-full w-max overflow-y-auto border border-gray-200 bg-white p-0 shadow-lg"
      role="listbox"
    >
      {options.map((option, optionIndex) => {
        const isActive = optionIndex === activeOptionIndex;
        const isSelected = option.value === selectedValue;

        return (
          <li
            key={option.value}
            className={cx('cursor-pointer select-none px-4 py-3 whitespace-nowrap outline-none', isActive && 'bg-blue-50')}
            aria-selected={isSelected}
            role="option"
            tabIndex={-1}
            onClick={() => onSelect(option.value)}
            onMouseDown={(event) => event.preventDefault()}
          >
            <span className="flex">
              {option.icone && <Image src={option.icone} alt="" width="16" height="16" className="mr-1" />}
              <span>{option.label}</span>
            </span>
            {option.description && <span className="block whitespace-nowrap text-xs text-slate-500">{option.description}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function getInitialActiveOptionIndex(selectedOptionIndex: number, optionsCount: number) {
  return selectedOptionIndex >= 0 ? selectedOptionIndex : Math.min(optionsCount - 1, 0);
}

function getNextActiveOptionIndex(currentActiveOptionIndex: number, offset: number, optionsCount: number) {
  if (optionsCount === 0) {
    return -1;
  }

  const normalizedActiveOptionIndex = currentActiveOptionIndex >= 0 ? currentActiveOptionIndex : 0;

  return (normalizedActiveOptionIndex + offset + optionsCount) % optionsCount;
}
