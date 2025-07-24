import React, { useMemo } from 'react';

import ChipAutoComplete, { type ChipAutoCompleteProps } from '@/components/ui/ChipAutoComplete';
import { defaultTagChipOption, useFCUTags } from '@/services/tags';

export type FCUTagAutocompleteProps = Omit<ChipAutoCompleteProps, 'options' | 'defaultOption'> & { undismissibles?: string[] };

const FCUTagAutocomplete: React.FC<FCUTagAutocompleteProps> = ({ undismissibles = [], value, suggestedValue, onChange, ...props }) => {
  const { tagsOptions } = useFCUTags();

  const options = useMemo(() => {
    return tagsOptions.map((option) => ({
      ...option,
      dismissible: !(undismissibles || []).includes(option.key),
    }));
  }, [tagsOptions, undismissibles]);

  const isMultiple = 'multiple' in props && props.multiple;

  if (isMultiple) {
    return (
      <ChipAutoComplete
        defaultOption={defaultTagChipOption}
        options={options}
        multiple={true}
        value={value as string[]}
        suggestedValue={suggestedValue as string[] | undefined}
        onChange={onChange as (value: string[]) => void}
        {...(props as Omit<typeof props, 'multiple' | 'value' | 'suggestedValue' | 'onChange'>)}
      />
    );
  }

  return (
    <ChipAutoComplete
      defaultOption={defaultTagChipOption}
      options={options}
      multiple={false}
      value={value as string}
      suggestedValue={suggestedValue as string | undefined}
      onChange={onChange as (value: string) => void}
      {...(props as Omit<typeof props, 'multiple' | 'value' | 'suggestedValue' | 'onChange'>)}
    />
  );
};

export default FCUTagAutocomplete;
