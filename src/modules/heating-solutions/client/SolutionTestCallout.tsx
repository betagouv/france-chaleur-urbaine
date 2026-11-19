import Link from '@/components/ui/Link';

/**
 * Repeated invitation to compare renewable heating options for the reader's building.
 */
export function SolutionTestCallout() {
  return (
    <div className="my-6 flex flex-col gap-4 bg-[#fef7da] p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <p className="mb-0 text-lg text-(--text-default-grey)">
        Le simulateur France Chaleur Renouvelable vous oriente vers les <strong>solutions les plus adaptées à votre bâtiment</strong> :
      </p>
      <Link href="/chaleur-renouvelable" variant="primary" className="shrink-0 self-start">
        Faites le test <span className="fr-icon-arrow-right-line ml-2" aria-hidden="true" />
      </Link>
    </div>
  );
}
