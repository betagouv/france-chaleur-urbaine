import { useEffect, useId, useRef, useState } from 'react';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import { trackPostHogEvent } from '@/modules/analytics/client';
import cx from '@/utils/cx';

import { type ProjectStatus, projectStatusOptions } from '../constants';

type ProjectStatusSelectProps = {
  className?: string;
  isPublicAdvisorSelected?: boolean;
  onChange: (value: ProjectStatus[]) => void;
  placeholder?: string;
  state?: 'default' | 'error';
  stateRelatedMessage?: string;
  value: ProjectStatus[];
};

/**
 * Shared project-stage dropdown and selected tags for the public CCRT form and the follow-up sheet.
 */
export function ProjectStatusSelect({
  className,
  isPublicAdvisorSelected,
  onChange,
  placeholder = 'Sélectionner une ou plusieurs étapes',
  state,
  stateRelatedMessage,
  value,
}: ProjectStatusSelectProps) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerLabel = getProjectStatusTriggerLabel(value, placeholder);

  const handleToggleOption = (optionValue: ProjectStatus) => {
    const nextValue = value.includes(optionValue)
      ? value.filter((selectedValue) => selectedValue !== optionValue)
      : [...value, optionValue];

    onChange(nextValue);

    if (isPublicAdvisorSelected !== undefined && nextValue.length > 0) {
      trackPostHogEvent('fcr_contact:project_stage_selected', {
        is_raccordable: !isPublicAdvisorSelected,
        stages: nextValue,
      });
    }
  };

  const handleTriggerClick = () => {
    setIsOpen((currentIsOpen) => !currentIsOpen);
  };

  // Close the dropdown when a click moves outside the selector.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={className}>
      <FieldWrapper
        fieldId={inputId}
        state={state}
        stateRelatedMessage={stateRelatedMessage}
        label={
          <>
            Où en êtes-vous de votre projet ?<small> (Optionnel)</small>
          </>
        }
        className="mb-0"
      >
        <div className="relative">
          <button
            id={inputId}
            type="button"
            className="fr-select w-full cursor-pointer bg-white text-left"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            onClick={handleTriggerClick}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          >
            <span className={cx('block truncate whitespace-nowrap overflow-hidden text-left', value.length === 0 && 'text-gray-500')}>
              {triggerLabel}
            </span>
          </button>

          {isOpen && (
            <ProjectStatusOptionList selectedValues={value} onClose={() => setIsOpen(false)} onToggleOption={handleToggleOption} />
          )}
        </div>
      </FieldWrapper>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((status) => (
            <span key={status} className="rounded-full bg-[#E3E3FD] px-3 py-1 text-xs font-medium text-blue">
              {status}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type ProjectStatusOptionListProps = {
  onClose: () => void;
  onToggleOption: (optionValue: ProjectStatus) => void;
  selectedValues: ProjectStatus[];
};

/**
 * Dropdown list of independently selectable project stages.
 */
function ProjectStatusOptionList({ onClose, onToggleOption, selectedValues }: ProjectStatusOptionListProps) {
  return (
    <div className="absolute top-full right-0 left-0 z-50 mt-1 border border-gray-200 bg-white shadow-lg">
      <div className="flex justify-end border-b border-gray-200 px-2 py-1">
        <button type="button" className="fr-icon-close-line text-sm" aria-label="Fermer la liste" onClick={onClose} />
      </div>

      <ul className="max-h-64 overflow-auto p-0" role="listbox" aria-multiselectable="true">
        {projectStatusOptions.map((option) => {
          const optionValue = option.nativeInputProps.value;
          const isSelected = selectedValues.includes(optionValue);

          return (
            <li key={optionValue} className="p-0">
              <button
                type="button"
                className={cx('flex w-full cursor-pointer items-start gap-3 px-4 py-2 text-left', isSelected && 'bg-blue-50')}
                aria-selected={isSelected}
                role="option"
                onClick={() => onToggleOption(optionValue)}
                onMouseDown={(event) => event.preventDefault()}
              >
                <span
                  className={cx(
                    'mt-1 flex h-4 w-4 p-2 shrink-0 items-center justify-center border border-blue',
                    isSelected && 'bg-blue text-white'
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <span className="fr-icon-check-line" />}
                </span>
                <span>{option.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getProjectStatusTriggerLabel(value: ProjectStatus[], placeholder: string) {
  if (value.length === 0) {
    return placeholder;
  }

  return value.length === 1 ? value[0] : `${value.length} étapes sélectionnées`;
}
