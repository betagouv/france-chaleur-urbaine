export function ProsConsLists({ avantages, inconvenients }: { avantages: string[]; inconvenients: string[] }) {
  return (
    <div>
      <h4 className="text-lg font-bold uppercase">
        <span className="text-success">Avantages</span>
        <span className="mx-3 inline-block font-normal">/</span>
        <span className="text-error">Inconvénients</span>
      </h4>
      <ul className="p-0">
        {avantages.map((avantage) => (
          <li key={avantage} className="flex gap-3">
            <span className="fr-icon-check-line text-success" aria-hidden="true" />
            <span>{avantage}</span>
          </li>
        ))}
      </ul>
      <ul className="p-0">
        {inconvenients.map((inconvenient) => (
          <li key={inconvenient} className="flex gap-3">
            <span className="fr-icon-close-line text-error" aria-hidden="true" />
            <span>{inconvenient}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
