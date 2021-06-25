type CallOutProps = {
  children?: React.ReactNode;
};

export const CallOutTitle: React.FC = (props) => (
  <header className="fr-callout__title" {...props} />
);

export const CallOut: React.FC<CallOutProps> = ({ children }) => {
  return (
    <div className="fr-callout fr-fi-information-line">
      <CallOutTitle />
      <div className="fr-callout__text">{children}</div>
    </div>
  );
};
