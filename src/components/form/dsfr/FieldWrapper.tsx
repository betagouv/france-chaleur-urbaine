import { fr } from '@codegouvfr/react-dsfr';
import React, { useId } from 'react';

import cx from '@utils/cx';

export type FieldWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
  fieldId?: string;
  className?: string;
  label?: React.ReactNode;
  hintText?: React.ReactNode;
  disabled?: boolean;
  state?: 'success' | 'error' | 'default';
  stateRelatedMessage?: React.ReactNode;
};

const FieldWrapper = ({
  className,
  fieldId,
  label,
  hintText,
  state = 'default',
  disabled,
  stateRelatedMessage,
  children,
  ...props
}: FieldWrapperProps) => {
  const generatedId = useId();

  return (
    <div
      className={cx(
        fr.cx('fr-input-group', {
          'fr-input-group--error': state === 'error',
          'fr-input-group--valid': state === 'success',
          'fr-input-group--disabled': disabled,
        }),
        className
      )}
      {...props}
    >
      {(label || hintText) && (
        <label className="fr-label" htmlFor={fieldId || generatedId}>
          {label}
          {hintText && <span className="fr-hint-text">{hintText}</span>}
        </label>
      )}
      {children}
      {state === 'error' && <p className="fr-error-text">{stateRelatedMessage}</p>}
    </div>
  );
};

export default FieldWrapper;
