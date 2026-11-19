import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import { useId, useState } from 'react';

import Button from '@/components/ui/Button';
import PopoverTrigger, { Popover, PopoverContent } from '@/components/ui/Popover';
import { originChannels } from '@/modules/analytics/demand-origin';

type CcrtDemandOriginFilterProps = { value: string; onChange: (value: string) => void; compact?: boolean };

/** Uses the same URL filter from the column header and the mobile filter panel. */
export function CcrtDemandOriginFilter({ value, onChange, compact = false }: CcrtDemandOriginFilterProps) {
  const [open, setOpen] = useState(false);
  const name = useId();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          priority={value ? 'secondary' : 'tertiary no outline'}
          size="small"
          iconId={value ? 'ri-filter-2-fill' : 'ri-filter-2-line'}
          title="Filtrer par origine"
          aria-pressed={!!value}
          className="shrink-0"
        >
          {compact ? undefined : 'Origine'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto p-4 normal-case font-normal">
        <RadioButtons
          legend="Origine de la demande"
          small
          options={[
            { label: 'Toutes les origines', value: '' },
            ...Object.entries(originChannels).map(([value, label]) => ({ label, value })),
          ].map((option) => ({
            label: option.label,
            nativeInputProps: {
              checked: value === option.value,
              name,
              onChange: () => {
                onChange(option.value);
                setOpen(false);
              },
              value: option.value,
            },
          }))}
        />
      </PopoverContent>
    </Popover>
  );
}
