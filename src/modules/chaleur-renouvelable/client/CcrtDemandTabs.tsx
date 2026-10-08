import cx from '@/utils/cx';

export const ccrtDemandTabs = [
  { description: 'Aucun contact engagé', label: 'À traiter', value: 'to_process' },
  { description: 'Contact ou étude engagés', label: 'En cours', value: 'in_progress' },
  { description: 'Réorientées ou abandonnées', label: 'Clôturées', value: 'closed' },
  { description: 'Historique complet', label: 'Toutes les demandes', value: 'all' },
] as const;

export type CcrtDemandTab = (typeof ccrtDemandTabs)[number]['value'];

type CcrtDemandTabsProps = {
  activeTab: CcrtDemandTab;
  counts: Record<CcrtDemandTab, number>;
  isLoading: boolean;
  onTabChange: (tab: CcrtDemandTab) => void;
};

/**
 * Demand groups with counters independent of search and status filters.
 */
export function CcrtDemandTabs({ activeTab, counts, isLoading, onTabChange }: CcrtDemandTabsProps) {
  return (
    <nav aria-label="Afficher les demandes par avancement" className="mb-6 flex flex-wrap gap-4">
      {ccrtDemandTabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-current={activeTab === tab.value ? 'true' : undefined}
          className={cx(
            'flex flex-col items-start border bg-(--background-default-grey) px-4 py-2 text-left',
            activeTab === tab.value
              ? 'border-(--border-active-blue-france) text-(--text-active-blue-france) shadow-[inset_0_-3px_0_var(--border-active-blue-france)]'
              : 'border-(--border-default-grey)'
          )}
          onClick={() => onTabChange(tab.value)}
        >
          <span className="text-2xl font-bold leading-8">{isLoading ? '—' : counts[tab.value]}</span>
          <span className="font-medium leading-6">
            {tab.label}
            {tab.value === 'to_process' && (
              <span aria-hidden className="fr-icon-warning-fill ml-1 text-(--text-default-warning) before:size-4" />
            )}
          </span>
          <span className={cx('text-sm leading-6', activeTab !== tab.value && 'text-(--text-mention-grey)')}>{tab.description}</span>
        </button>
      ))}
    </nav>
  );
}
