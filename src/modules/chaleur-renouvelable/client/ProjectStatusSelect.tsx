import { useId, useState } from 'react';

import Checkboxes from '@/components/form/dsfr/Checkboxes';
import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
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
 * Public project-stage selection using shared popover and checkbox controls.
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
  const [isOpen, setIsOpen] = useState(false);
  const triggerLabel = value.length === 0 ? placeholder : value.length === 1 ? value[0] : `${value.length} étapes sélectionnées`;

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

  return (
    <div className={className}>
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button id={inputId} type="button" className="fr-select w-full cursor-pointer bg-white text-left">
              <span className={cx('block truncate whitespace-nowrap overflow-hidden text-left', value.length === 0 && 'text-gray-500')}>
                {triggerLabel}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={4} className="w-(--radix-popover-trigger-width) rounded-none! border border-gray-200">
            <div className="flex justify-end border-b border-gray-200 px-2 py-1">
              <button type="button" className="fr-icon-close-line text-sm" aria-label="Fermer la liste" onClick={() => setIsOpen(false)} />
            </div>
            <Checkboxes
              label="Étapes du projet"
              classes={{ legend: 'sr-only' }}
              className="m-0! max-h-64 overflow-auto px-4 py-2 [&_input:checked+label]:bg-blue-50"
              options={projectStatusOptions.map((option) => ({
                ...option,
                nativeInputProps: {
                  ...option.nativeInputProps,
                  checked: value.includes(option.nativeInputProps.value),
                  onChange: () => handleToggleOption(option.nativeInputProps.value),
                },
              }))}
            />
          </PopoverContent>
        </Popover>
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
