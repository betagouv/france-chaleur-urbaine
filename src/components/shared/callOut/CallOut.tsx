import React from 'react';
import { CallOutContainer } from './CallOut.style';

type CallOutProps = {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'error';
};

export const CallOutTitle: React.FC = (props) => (
  <header className="fr-callout__title" {...props} />
);

export const CallOutBody: React.FC = (props) => (
  <div className="fr-callout__text" {...props} />
);

export const CallOut: React.FC<CallOutProps> = ({
  children,
  variant = 'default',
}) => (
  <CallOutContainer className="fr-callout" variant={variant}>
    {children}
  </CallOutContainer>
);
