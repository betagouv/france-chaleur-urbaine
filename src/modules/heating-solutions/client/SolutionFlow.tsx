type SolutionFlowProps = {
  steps: { label: string; description?: string }[];
};

/**
 * Readable functional diagram whose ordered text is also available without graphics.
 */
export function SolutionFlow({ steps }: SolutionFlowProps) {
  return (
    <div className="my-4 rounded-2xl bg-[#ededff] p-4 print:break-inside-avoid">
      <p className="mb-3 text-center text-sm font-normal uppercase text-(--text-title-blue-france)">Comment la chaleur circule-t-elle ?</p>
      <ol className="m-0 list-none space-y-2 p-0 [&>li::marker]:content-none">
        {steps.map((step, index) => (
          <li key={`${index}-${step.label}`} className="text-center">
            {index > 0 && <span aria-hidden="true" className="fr-icon-arrow-down-line mb-2 block text-(--text-title-blue-france)" />}
            <p className="mb-0 whitespace-pre-line rounded bg-white px-3 py-2 text-base">
              <strong>{step.label}</strong>
              {step.description && <span className="block">{step.description}</span>}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
