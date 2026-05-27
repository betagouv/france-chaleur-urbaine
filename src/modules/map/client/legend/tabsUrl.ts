import { createParser } from 'nuqs';

/**
 * Tab + sub-tab tree backing the legend's `?tabId=` URL param. Single source of
 * truth for valid values: anything not listed here parses as `null`.
 */
export const tabsTree = {
  enrr: [],
  outils: ['mesure-distance', 'extraction-batiments', 'densite-thermique-lineaire'],
  potentiel: [],
  reseaux: ['filtres'],
} as const satisfies Record<string, readonly string[]>;

export type TabId = keyof typeof tabsTree;
export type TabState = {
  [K in TabId]: { tabId: K; subTabId: (typeof tabsTree)[K][number] | null };
}[TabId];

/**
 * `tabId` URL param parser. Encodes the tab tree as a `tabId/subTabId` path so a
 * shared link drops the user directly on the right view (V1 parity).
 */
export const tabsParser = createParser<TabState>({
  eq: (a, b) => a.tabId === b.tabId && a.subTabId === b.subTabId,
  parse: (query) => {
    const [rawTab, rawSub] = query.split('/');
    if (!(rawTab in tabsTree)) return null;
    const tabId = rawTab as TabId;
    const subTabs = tabsTree[tabId] as readonly string[];
    if (!rawSub) return { subTabId: null, tabId } as TabState;
    if (!subTabs.includes(rawSub)) return null;
    return { subTabId: rawSub, tabId } as TabState;
  },
  serialize: ({ tabId, subTabId }) => (subTabId ? `${tabId}/${subTabId}` : tabId),
});

export const defaultTabState: TabState = { subTabId: null, tabId: 'reseaux' };
