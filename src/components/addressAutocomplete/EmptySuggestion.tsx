import React from 'react';

export const EmptySuggestion: React.FC<{ text?: string }> = ({
  text = 'Aucune adresse trouvée :(',
}) => (
  <p
    style={{
      margin: 0,
      color: '#454545',
      padding: '0.25rem 1rem 0.75rem 1rem',
      fontStyle: 'italic',
    }}
  >
    {text}
  </p>
);
