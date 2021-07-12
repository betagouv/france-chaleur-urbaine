const Alert: React.FC = (props) => {
  return (
    <div className="fr-callout fr-fi-information-line">
      <header className="fr-callout__title" {...props} />
    </div>
  );
};

export default Alert;
