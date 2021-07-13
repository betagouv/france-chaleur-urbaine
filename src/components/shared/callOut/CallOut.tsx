import { Error, Success } from '@components/shared/callOut/CallOut.style';

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
}) => {
  return variant == 'success' ? (
    <Success className="fr-callout">{children}</Success>
  ) : variant == 'error' ? (
    <Error className="fr-callout">{children}</Error>
  ) : (
    <div className="fr-callout">{children}</div>
  );
};
