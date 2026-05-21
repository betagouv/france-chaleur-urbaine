import * as RadixAccordion from '@radix-ui/react-accordion';
import { type ReactNode, useId } from 'react';

import Tooltip from '@/components/ui/Tooltip';
import useArrayQueryState from '@/hooks/useArrayQueryState';
import cx from '@/utils/cx';

const ITEM_VALUE = 'item';

/**
 * Shared base wrapper around a single-item `<Accordion.Root>` — keeps the
 * default / controlled props normalisation in one place.
 *
 * When `urlStateId` is set, the open/closed state is persisted in the
 * `?accordions=` query param (same scheme as the rest of the legend).
 */
type BaseProps = {
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Persist open/closed state in the `?accordions=` URL param under this id. */
  urlStateId?: string;
  className?: string;
  children: ReactNode;
};

function useUrlExpansion(urlStateId: string | undefined) {
  const { has, add, remove } = useArrayQueryState('accordions');
  if (!urlStateId) return null;
  return {
    expanded: has(urlStateId),
    setExpanded: (next: boolean) => (next ? add(urlStateId) : remove(urlStateId)),
  };
}

function AccordionRoot({ defaultExpanded, expanded, onExpandedChange, urlStateId, className, children }: BaseProps) {
  const urlState = useUrlExpansion(urlStateId);
  const effectiveExpanded = urlState ? urlState.expanded : expanded;
  const effectiveOnChange = urlState ? urlState.setExpanded : onExpandedChange;
  return (
    <RadixAccordion.Root
      type="single"
      collapsible
      defaultValue={defaultExpanded ? ITEM_VALUE : undefined}
      value={effectiveExpanded === undefined ? undefined : effectiveExpanded ? ITEM_VALUE : ''}
      onValueChange={effectiveOnChange ? (v) => effectiveOnChange(v === ITEM_VALUE) : undefined}
      className={className}
    >
      <RadixAccordion.Item value={ITEM_VALUE}>{children}</RadixAccordion.Item>
    </RadixAccordion.Root>
  );
}

/**
 * Animated content wrapper — shared between both variants.
 *
 * Animation classes live in `globals.css` (raw CSS, no Tailwind utilities)
 * so they don't carry Tailwind's project-wide `important: true`. Radix needs
 * to temporarily override `animation-name` inline while it measures content
 * height for `--radix-collapsible-content-height` — and inline styles can
 * only win over rules without `!important`.
 *
 * Closed content is fully unmounted by radix → cheap initial mount of the
 * legend (each layer subscribes to the config atom, so this matters).
 */
function Content({ children, className }: { children: ReactNode; className?: string }) {
  return <RadixAccordion.Content className={cx('legend-accordion-content', className)}>{children}</RadixAccordion.Content>;
}

// DSFR action-blue accent shared by both variants — the label, the chevron
// icon and the hover affordances all sit on `--text-action-high-blue-france`,
// matching the DSFR Tabs / NavMenu look.
const labelClasses = 'flex-1 text-sm font-medium text-(--text-action-high-blue-france)';
const chevronClasses =
  'fr-icon-arrow-down-s-line fr-icon--sm shrink-0 transition-transform duration-200 text-(--text-action-high-blue-france)';

type MapAccordionProps = BaseProps & {
  /** Header content; the whole row toggles the accordion. */
  label: ReactNode;
};

/**
 * Simple accordion — the whole header row is the toggle. Looks like DSFR
 * `fr-accordion--simple` minus the styled-components rigidity.
 */
export function MapAccordion({ label, defaultExpanded, expanded, onExpandedChange, urlStateId, className, children }: MapAccordionProps) {
  return (
    <AccordionRoot
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      urlStateId={urlStateId}
      className={className}
    >
      <RadixAccordion.Header className="mb-0">
        <RadixAccordion.Trigger className="group flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-(--background-default-grey-hover) data-[state=open]:bg-(--background-open-blue-france) data-[state=open]:hover:bg-(--background-open-blue-france-hover)">
          <span className={labelClasses}>{label}</span>
          <span aria-hidden className={cx(chevronClasses, 'group-data-[state=open]:rotate-180')} />
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
      <Content>{children}</Content>
    </AccordionRoot>
  );
}

type MapCheckableAccordionProps = BaseProps & {
  /** Visible text next to the checkbox. */
  label: ReactNode;
  /** Checkbox state. */
  checked: boolean;
  /** Called when the checkbox changes. */
  onCheckChange: (checked: boolean) => void;
  /** Optional swatch / icon between the checkbox and the label. */
  icon?: ReactNode;
  /** Optional tooltip rendered after the label. */
  tooltip?: ReactNode;
  contentClassName?: string;
};

/**
 * Checkable accordion — checkbox + label + chevron-at-end-of-line.
 * Only the chevron toggles expand/collapse; the checkbox handles its own state.
 * Mirrors V1's `CheckableAccordion` but Tailwind-only, no styled-components.
 */
export function MapCheckableAccordion({
  label,
  checked,
  onCheckChange,
  icon,
  tooltip,
  defaultExpanded,
  expanded,
  onExpandedChange,
  urlStateId,
  className,
  contentClassName,
  children,
}: MapCheckableAccordionProps) {
  const id = useId();
  // Auto-expand on check=true (V1 `expandOnCheck` parity). The setter comes
  // from URL state when bound; otherwise the parent's `onExpandedChange`.
  const urlExpansion = useUrlExpansion(urlStateId);
  const setExpanded = urlExpansion ? urlExpansion.setExpanded : onExpandedChange;
  const handleCheckChange = (next: boolean) => {
    onCheckChange(next);
    if (next) setExpanded?.(true);
  };
  return (
    <AccordionRoot
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      urlStateId={urlStateId}
      className={className}
    >
      {/* Row container is `items-stretch` so the chevron toggle on the right
          can span the full row height (V1 parity — DSFR `.fr-accordion__btn`
          with `self-stretch`). Vertical padding lives on the label/checkbox
          wrapper instead of the row, so the toggle truly fills top-to-bottom. */}
      <div className="flex items-stretch gap-2 pl-3">
        <div className="flex flex-1 items-center gap-2 py-3 min-w-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => handleCheckChange(e.target.checked)}
            // `accent-color` tints the native checkbox with the DSFR action blue
            // (filled blue + white check when checked) — matches V1 without the
            // cost of the full pseudo-element DSFR mark-up.
            className="size-4 cursor-pointer shrink-0 accent-(--background-active-blue-france)"
          />
          {icon}
          <label htmlFor={id} className="flex-1 cursor-pointer text-sm">
            {label}
          </label>
          {tooltip && <Tooltip title={tooltip} iconProps={{ className: 'text-(--text-action-high-blue-france)' }} />}
        </div>
        <RadixAccordion.Header asChild>
          <RadixAccordion.Trigger
            aria-label="Développer la section"
            className="group inline-flex w-7 items-center justify-center self-stretch hover:bg-(--background-default-grey-hover) data-[state=open]:bg-(--background-open-blue-france) data-[state=open]:hover:bg-(--background-open-blue-france-hover)"
          >
            <span aria-hidden className={cx(chevronClasses, 'group-data-[state=open]:rotate-180')} />
          </RadixAccordion.Trigger>
        </RadixAccordion.Header>
      </div>
      {/* Default padding mirrors V1's per-legend wrapper (`flex flex-col pt-2
          pl-3 pr-1`) so individual legend defs don't need their own div.
          Pass `contentClassName` to add extras (e.g. `gap-1`). */}
      <Content className={cx('flex flex-col px-3 pr-1', contentClassName)}>{children}</Content>
    </AccordionRoot>
  );
}
