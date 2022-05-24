import { ComboboxList, ComboboxOption } from '@reach/combobox';
import React from 'react';
import { SuggestionItem } from 'src/types';

type SuggestionListProps = {
  suggestions: SuggestionItem[];
};

const Suggestions: React.FC<SuggestionListProps> = ({ suggestions }) => (
  <ComboboxList>
    {suggestions.map(({ properties }: SuggestionItem, index) => {
      return (
        <ComboboxOption key={properties.id + index} value={properties.label} />
      );
    })}
  </ComboboxList>
);

export default Suggestions;
