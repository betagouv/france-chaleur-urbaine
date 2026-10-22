import type { CcrtTrackingTab } from '@/modules/analytics/posthog.config';
import cx from '@/utils/cx';

export const ccrtDemandTabs = [
  { description: 'Aucun contact engagé', label: 'À traiter', value: 'to_process' },
  { description: 'Contact ou étude engagés', label: 'En cours', value: 'in_progress' },
  { description: 'Réorientées ou abandonnées', label: 'Clôturées', value: 'closed' },
  { description: 'Historique complet', label: 'Toutes les demandes', value: 'all' },
] as const;

export type CcrtDemandTab = (typeof ccrtDemandTabs)[number]['value'];

export const ccrtTrackingTabs = { all: 'toutes', closed: 'cloturees', in_progress: 'en_cours', to_process: 'a_traiter' } satisfies Record<
  CcrtDemandTab,
  CcrtTrackingTab
>;

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
    <nav aria-label="Afficher les demandes par avancement" className="mb-4 flex flex-wrap gap-2 lg:mb-6 lg:gap-4">
      {ccrtDemandTabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-current={activeTab === tab.value ? 'true' : undefined}
          className={cx(
            'flex items-center gap-1 rounded-2xl border px-2.5 py-1 text-sm leading-6 lg:flex-col lg:items-start lg:gap-0 lg:rounded-none lg:px-4 lg:py-2 lg:text-base lg:text-left',
            tab.value === 'closed' && 'order-4 lg:order-none',
            tab.value === 'all' && 'order-3 lg:order-none',
            activeTab === tab.value
              ? 'border-(--border-active-blue-france) bg-(--background-action-high-blue-france) text-(--text-inverted-blue-france) lg:bg-(--background-default-grey) lg:text-(--text-active-blue-france) lg:shadow-[inset_0_-3px_0_var(--border-active-blue-france)]'
              : 'border-(--border-active-blue-france) bg-(--background-default-grey) text-(--text-action-high-blue-france) lg:border-(--border-default-grey) lg:text-(--text-default-grey)'
          )}
          onClick={() => onTabChange(tab.value)}
        >
          <span className="hidden text-2xl font-bold leading-8 lg:block">{isLoading ? '—' : counts[tab.value]}</span>
          <span className="font-medium leading-6">
            {tab.value === 'all' ? (
              <>
                <span className="lg:hidden">Toutes</span>
                <span className="hidden lg:inline">{tab.label}</span>
              </>
            ) : (
              tab.label
            )}
            {(tab.value === 'to_process' || tab.value === 'in_progress') && (
              <span className="lg:hidden"> ({isLoading ? '—' : counts[tab.value]})</span>
            )}
            {tab.value === 'to_process' && (
              <span aria-hidden className="fr-icon-warning-fill ml-1 hidden text-(--text-default-warning) before:size-4 lg:inline-block" />
            )}
          </span>
          <span className={cx('hidden text-sm leading-6 lg:block', activeTab !== tab.value && 'text-(--text-mention-grey)')}>
            {tab.description}
          </span>
        </button>
      ))}
    </nav>
  );
}
