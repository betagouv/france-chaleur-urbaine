import type { ReactNode } from 'react';

import { UrlStateAccordion } from '@/components/ui/Accordion';
import { CheckableAccordion } from '@/components/ui/CheckableAccordion';
import Tooltip from '@/components/ui/Tooltip';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';

type LegendSectionProps = {
  title: NonNullable<ReactNode>;
  /** Unique id; persists open/closed state via `?accordions=`. */
  id: string;
  /** If set, the header is a checkable accordion bound to this config path. */
  togglePath?: MapConfigurationProperty<boolean>;
  /** Optional swatch / icon rendered right after the checkbox, before the title. */
  icon?: ReactNode;
  /** Optional tooltip rendered after the title. */
  tooltip?: ReactNode;
  children: NonNullable<ReactNode>;
};

// `!` overrides the font-weight injected by `CheckableAccordion`'s styled rules.
const titleClasses = 'flex items-start w-full text-sm font-normal! text-(--text-default-grey)! gap-2';

const TOOLTIP_BLUE_ICON = { className: 'text-(--text-action-high-blue-france)' };

// Default body text size for legend sub-sections. ~13px so it stays denser than
// the standard DSFR 14/16px without being squinty. Descendants inherit via the
// CSS cascade — only override locally if a specific element needs a different
// size.
const bodyClasses = 'text-[13px]';

/** Either a checkable accordion (when `togglePath` is set) or a plain URL-state accordion. */
export function LegendSection({ id, title, togglePath, icon, tooltip, children }: LegendSectionProps) {
  const { read, toggleLayer } = useMapConfig();

  if (togglePath) {
    const checked = read<boolean>(togglePath);
    return (
      <CheckableAccordion
        small
        classes={{ title: titleClasses }}
        label={
          <>
            {icon}
            <span className="flex-1">{title}</span>
            {tooltip && <Tooltip title={tooltip} iconProps={TOOLTIP_BLUE_ICON} />}
          </>
        }
        checked={checked}
        onCheck={() => toggleLayer(togglePath)}
        expandOnCheck
        showToggle
        defaultExpanded={checked}
      >
        <div className={bodyClasses}>{children}</div>
      </CheckableAccordion>
    );
  }

  return (
    <UrlStateAccordion id={id} label={title} simple>
      <div className={bodyClasses}>{children}</div>
    </UrlStateAccordion>
  );
}
