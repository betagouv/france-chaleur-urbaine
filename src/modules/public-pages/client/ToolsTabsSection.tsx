import { useState } from 'react';

import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Section from '@/components/ui/Section';
import { trackPostHogEvent } from '@/modules/analytics/client';
import cx from '@/utils/cx';

import { type PublicPageTool, TOOL_TABS, type ToolTabId } from '../constants';

/**
 * "Tous vos outils sont ici" section: tool tiles grouped in two switchable tabs
 * (heat networks only / every renewable energy).
 */
export function ToolsTabsSection() {
  const [selectedTabId, setSelectedTabId] = useState<ToolTabId>(TOOL_TABS[0].id);
  const selectedTab = TOOL_TABS.find((tab) => tab.id === selectedTabId) ?? TOOL_TABS[0];

  return (
    <Section variant="light">
      <h2 className="fr-h2 mb-4 font-bold">Tous vos outils sont ici</h2>
      <div role="tablist" aria-label="Catégories d’outils" className="mb-6 flex flex-wrap gap-2">
        {TOOL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tools-tab-${tab.id}`}
            aria-selected={tab.id === selectedTabId}
            aria-controls={`tools-panel-${tab.id}`}
            className={cx(
              'fr-tag',
              tab.id === selectedTabId
                ? 'border border-[#000091] bg-info-light! text-[#000091]!'
                : 'bg-white! text-gray-700! border border-gray-300'
            )}
            onClick={() => {
              setSelectedTabId(tab.id);
              trackPostHogEvent('home:tools_tab_selected', { tab: tab.id });
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tools-panel-${selectedTab.id}`}
        aria-labelledby={`tools-tab-${selectedTab.id}`}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {selectedTab.tools.map((tool) => (
          <ToolTile key={tool.name} {...tool} />
        ))}
      </div>
    </Section>
  );
}

type ToolTileProps = PublicPageTool;

function ToolTile({ description, eventKey, href, icon, name, title }: ToolTileProps) {
  return (
    <Link
      href={href}
      eventKey={eventKey}
      postHogEventKey="home:tool_tile_clicked"
      postHogEventProps={{ element_name: name }}
      className="flex gap-4 rounded-lg border border-gray-200 bg-white p-6 bg-none! shadow-none! hover:bg-gray-50!"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#E3E3FD] text-[#000091]">
        <Icon name={icon} size="md" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-xl font-bold text-[#000091]">{title}</span>
          <Icon name="fr-icon-arrow-right-line" size="sm" className="text-[#000091]" />
        </span>
        <span className="text-sm text-gray-700">{description}</span>
      </span>
    </Link>
  );
}
