import React from 'react';

import Infobulle from '@components/ui/Infobulle';
import { upperCaseFirstChar } from '@utils/strings';

type LabelProps = React.HTMLAttributes<HTMLSpanElement> & {
  label?: React.ReactNode;
  help?: React.ReactNode;
  unit?: string;
};
const Label: React.FC<LabelProps> = ({ label, unit, help }) => {
  return (
    <span style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '2px' }}>
      <span>
        {typeof label === 'string' ? upperCaseFirstChar(label) : label}
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
      {help && (
        <Infobulle
          style={{
            marginTop: '-1px', // icon is not well balanced and has a small margin on top
          }}
        >
          {help}
        </Infobulle>
      )}
    </span>
  );
};

export default Label;
