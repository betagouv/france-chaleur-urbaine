/**
 * Displays a visual marker for heating modes that can also provide cooling.
 */
export function CoolingPossibleTag() {
  return (
    <div className="my-4">
      <span className="inline-flex items-center gap-2 bg-[#E5FBFD] px-3 py-2 text-sm text-info">
        <span className="fr-icon-windy-line" aria-hidden="true" />
        Rafraîchissement possible
      </span>
    </div>
  );
}
