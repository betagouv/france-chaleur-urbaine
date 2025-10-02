import type React from 'react';

import Tooltip from '@/components/ui/Tooltip';
import { upperCaseFirstChar } from '@/utils/strings';

import labels from './labels';

type LabelProps = React.HTMLAttributes<HTMLSpanElement> & {
  label?: React.ReactNode;
  help?: React.ReactNode;
  unit?: string;
};

const Label: React.FC<LabelProps> = ({ label, unit, help }) => {
  const displayLabel = typeof label === 'string' ? labels[label] || label : label;

  return (
    <span style={{ alignItems: 'start', display: 'flex', gap: '2px', justifyContent: 'space-between' }}>
      <span>
        {typeof displayLabel === 'string' ? upperCaseFirstChar(displayLabel) : displayLabel}
        {unit ? (
          <small
            style={{
              opacity: 0.6, // maybe using a color from DSFR would be better but could not find a "faded" one
            }}
          >
            {' '}
            ({unit})
          </small>
        ) : (
          ''
        )}
      </span>
      {help && <Tooltip title={help} />}
    </span>
  );
};

export default Label;
